import { apiClient, MOCK_MODE, tokenStorage } from "@/lib/api-client"
import { mockAuthApi } from "@/lib/mock-auth"
import type { User } from "@/types"

export interface SignupPayload {
  email: string
  username: string
  password: string
  full_name?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

// In prototype mode (no VITE_API_URL configured) everything here runs against
// a localStorage-backed mock instead of a real server — see mock-auth.ts.
// Same request/response shape either way, so nothing else in the app needs to care.
export const authApi = {
  signup: (payload: SignupPayload) =>
    MOCK_MODE
      ? mockAuthApi.signup(payload.email, payload.username, payload.password, payload.full_name)
      : apiClient.post<TokenResponse>("/auth/signup", payload),

  login: (payload: LoginPayload) =>
    MOCK_MODE
      ? mockAuthApi.login(payload.email, payload.password)
      : apiClient.post<TokenResponse>("/auth/login", payload),

  logout: () => (MOCK_MODE ? mockAuthApi.logout() : apiClient.post("/auth/logout")),

  getMe: () =>
    MOCK_MODE ? mockAuthApi.getMe(tokenStorage.getAccessToken()) : apiClient.get<User>("/auth/me"),

  updateMe: (payload: Partial<Pick<User, "full_name" | "avatar_url" | "theme" | "language" | "preferred_model">>) =>
    MOCK_MODE
      ? mockAuthApi.updateMe(tokenStorage.getAccessToken(), payload)
      : apiClient.patch<User>("/auth/me", payload),

  changePassword: (current_password: string, new_password: string) =>
    MOCK_MODE
      ? mockAuthApi.changePassword(tokenStorage.getAccessToken(), current_password, new_password)
      : apiClient.post("/auth/change-password", { current_password, new_password }),

  deleteAccount: () =>
    MOCK_MODE ? mockAuthApi.deleteAccount(tokenStorage.getAccessToken()) : apiClient.delete("/auth/me"),
}
