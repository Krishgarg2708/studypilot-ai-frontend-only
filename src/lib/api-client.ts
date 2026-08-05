// Central axios instance: attaches the access token to every request, and transparently
// refreshes it on a 401 (using the rotating refresh token from auth_service on the
// backend) before retrying the original request exactly once.
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

const ACCESS_TOKEN_KEY = "studypilot_access_token"
const REFRESH_TOKEN_KEY = "studypilot_refresh_token"

// Prototype mode: no real backend is deployed yet, so auth runs entirely against
// a localStorage mock (see mock-auth.ts). Set VITE_API_URL in your environment
// (e.g. Vercel project settings) once a real backend is live to switch this off.
export const MOCK_MODE = !import.meta.env.VITE_API_URL

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api",
  headers: { "Content-Type": "application/json" },
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig

    if (error.response?.status !== 401 || originalRequest._retry || originalRequest.url?.includes("/auth/")) {
      return Promise.reject(error)
    }

    const refreshToken = tokenStorage.getRefreshToken()
    if (!refreshToken) {
      tokenStorage.clearTokens()
      window.location.href = "/login"
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      // A refresh is already in flight — queue this request until it resolves.
      return new Promise((resolve) => {
        refreshSubscribers.push((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(apiClient(originalRequest))
        })
      })
    }

    isRefreshing = true
    try {
      const { data } = await axios.post("/api/auth/refresh", { refresh_token: refreshToken })
      tokenStorage.setTokens(data.access_token, data.refresh_token)
      onRefreshed(data.access_token)
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      tokenStorage.clearTokens()
      window.location.href = "/login"
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
    return error.message
  }
  // Mock-mode errors (see mock-auth.ts) mimic the same { response: { data: { detail } } } shape
  // as an Axios error but aren't instances of AxiosError, so axios.isAxiosError() misses them.
  if (error && typeof error === "object" && "response" in error) {
    const detail = (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
    if (typeof detail === "string") return detail
  }
  if (error instanceof Error) return error.message
  return "An unexpected error occurred."
}
