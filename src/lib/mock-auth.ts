// Prototype-mode auth: simulates the backend entirely in localStorage so the app
// is fully clickable/demoable with no server running. Not real security — every
// "password" and token lives in the browser. Swap this out once a real backend
// is deployed (see api-client.ts / auth.ts).
import type { User } from "@/types"

interface StoredUser extends User {
  password: string
}

const USERS_KEY = "studypilot_mock_users"
const SESSION_KEY = "studypilot_mock_session" // maps token -> user id

function readUsers(): Record<string, StoredUser> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}")
  } catch {
    return {}
  }
}

function writeUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function readSessions(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "{}")
  } catch {
    return {}
  }
}

function writeSessions(sessions: Record<string, string>) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessions))
}

function makeToken(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

function toPublicUser(u: StoredUser): User {
  const { password: _password, ...pub } = u
  return pub
}

class MockApiError extends Error {
  response: { status: number; data: { detail: string } }
  constructor(status: number, detail: string) {
    super(detail)
    this.response = { status, data: { detail } }
  }
}

// Small artificial delay so loading states feel real instead of instant/flickery.
function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export const mockAuthApi = {
  async signup(email: string, username: string, password: string, full_name?: string) {
    const users = readUsers()
    if (users[email]) {
      throw new MockApiError(400, "An account with this email already exists.")
    }
    const user: StoredUser = {
      id: makeToken("user"),
      email,
      username,
      full_name: full_name || null,
      avatar_url: null,
      theme: "dark",
      language: "en",
      preferred_model: "default",
      is_verified: true,
      created_at: new Date().toISOString(),
      password,
    }
    users[email] = user
    writeUsers(users)

    const access_token = makeToken("access")
    const refresh_token = makeToken("refresh")
    const sessions = readSessions()
    sessions[access_token] = user.id
    sessions[refresh_token] = user.id
    writeSessions(sessions)

    return delay({ data: { access_token, refresh_token, token_type: "bearer" } })
  },

  async login(email: string, password: string) {
    const users = readUsers()
    const user = users[email]
    if (!user || user.password !== password) {
      throw new MockApiError(401, "Incorrect email or password.")
    }
    const access_token = makeToken("access")
    const refresh_token = makeToken("refresh")
    const sessions = readSessions()
    sessions[access_token] = user.id
    sessions[refresh_token] = user.id
    writeSessions(sessions)

    return delay({ data: { access_token, refresh_token, token_type: "bearer" } })
  },

  async getMe(token: string | null) {
    if (!token) throw new MockApiError(401, "Not authenticated.")
    const sessions = readSessions()
    const userId = sessions[token]
    if (!userId) throw new MockApiError(401, "Session expired.")
    const users = readUsers()
    const user = Object.values(users).find((u) => u.id === userId)
    if (!user) throw new MockApiError(401, "User not found.")
    return delay({ data: toPublicUser(user) }, 150)
  },

  async updateMe(token: string | null, updates: Partial<User>) {
    if (!token) throw new MockApiError(401, "Not authenticated.")
    const sessions = readSessions()
    const userId = sessions[token]
    const users = readUsers()
    const entry = Object.entries(users).find(([, u]) => u.id === userId)
    if (!entry) throw new MockApiError(401, "Not authenticated.")
    const [email, user] = entry
    const updated = { ...user, ...updates }
    users[email] = updated
    writeUsers(users)
    return delay({ data: toPublicUser(updated) }, 150)
  },

  async changePassword(token: string | null, current_password: string, new_password: string) {
    if (!token) throw new MockApiError(401, "Not authenticated.")
    const sessions = readSessions()
    const userId = sessions[token]
    const users = readUsers()
    const entry = Object.entries(users).find(([, u]) => u.id === userId)
    if (!entry) throw new MockApiError(401, "Not authenticated.")
    const [email, user] = entry
    if (user.password !== current_password) {
      throw new MockApiError(400, "Current password is incorrect.")
    }
    users[email] = { ...user, password: new_password }
    writeUsers(users)
    return delay({ data: { success: true } }, 150)
  },

  async deleteAccount(token: string | null) {
    if (!token) throw new MockApiError(401, "Not authenticated.")
    const sessions = readSessions()
    const userId = sessions[token]
    const users = readUsers()
    const entry = Object.entries(users).find(([, u]) => u.id === userId)
    if (entry) {
      delete users[entry[0]]
      writeUsers(users)
    }
    Object.keys(sessions).forEach((t) => {
      if (sessions[t] === userId) delete sessions[t]
    })
    writeSessions(sessions)
    return delay({ data: { success: true } }, 150)
  },

  async logout() {
    return delay({ data: { success: true } }, 100)
  },
}

export { MockApiError }
