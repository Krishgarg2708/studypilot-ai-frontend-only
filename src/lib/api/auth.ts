import { apiClient } from "@/lib/api-client"
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

export const authApi = {
  signup: (payload: SignupPayload) => apiClient.post<TokenResponse>("/auth/signup", payload),
  login: (payload: LoginPayload) => apiClient.post<TokenResponse>("/auth/login", payload),
  logout: () => apiClient.post("/auth/logout"),
  getMe: () => apiClient.get<User>("/auth/me"),
  updateMe: (payload: Partial<Pick<User, "full_name" | "avatar_url" | "theme" | "language" | "preferred_model">>) =>
    apiClient.patch<User>("/auth/me", payload),
  changePassword: (current_password: string, new_password: string) =>
    apiClient.post("/auth/change-password", { current_password, new_password }),
  deleteAccount: () => apiClient.delete("/auth/me"),
}
