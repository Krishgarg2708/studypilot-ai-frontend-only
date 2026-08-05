import { create } from "zustand"
import type { User } from "@/types"
import { authApi } from "@/lib/api/auth"
import { tokenStorage } from "@/lib/api-client"

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, username: string, password: string, fullName?: string) => Promise<void>
  logout: () => Promise<void>
  fetchCurrentUser: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await authApi.login({ email, password })
    tokenStorage.setTokens(data.access_token, data.refresh_token)
    await get().fetchCurrentUser()
  },

  signup: async (email, username, password, fullName) => {
    const { data } = await authApi.signup({ email, username, password, full_name: fullName })
    tokenStorage.setTokens(data.access_token, data.refresh_token)
    await get().fetchCurrentUser()
  },

  logout: async () => {
    try {
      await authApi.logout()
    } finally {
      tokenStorage.clearTokens()
      set({ user: null, isAuthenticated: false })
    }
  },

  fetchCurrentUser: async () => {
    if (!tokenStorage.getAccessToken()) {
      set({ isLoading: false, isAuthenticated: false, user: null })
      return
    }
    try {
      const { data } = await authApi.getMe()
      set({ user: data, isAuthenticated: true, isLoading: false })
    } catch {
      tokenStorage.clearTokens()
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  updateUser: (updates) => set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
}))
