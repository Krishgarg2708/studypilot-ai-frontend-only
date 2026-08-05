import { apiClient } from "@/lib/api-client"
import type { ChatSession, ChatMessage } from "@/types"

export const chatApi = {
  listSessions: () => apiClient.get<ChatSession[]>("/chat/sessions"),
  getSession: (id: string) => apiClient.get<ChatSession & { messages: ChatMessage[] }>(`/chat/sessions/${id}`),
  createSession: (mode: string = "general", title?: string, model?: string) =>
    apiClient.post<ChatSession>("/chat/sessions", { mode, title, model }),
  deleteSession: (id: string) => apiClient.delete(`/chat/sessions/${id}`),
  sendMessage: (sessionId: string, content: string, model?: string) =>
    apiClient.post<ChatMessage>(`/chat/sessions/${sessionId}/messages`, { content, model }),
  quickAction: (action: string, topic: string, sessionId?: string, model?: string) =>
    apiClient.post<ChatMessage>("/chat/quick-action", { action, topic, session_id: sessionId, model }),
  streamMessage: (sessionId: string, content: string, model: string | undefined, onToken: (token: string) => void, onDone: () => void) => {
    // SSE via fetch since axios doesn't natively support streaming response bodies well
    // across all environments; fetch + ReadableStream is the most portable approach.
    const token = localStorage.getItem("studypilot_access_token")
    return fetch(`/api/chat/sessions/${sessionId}/messages/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content, model }),
    }).then(async (response) => {
      const reader = response.body?.getReader()
      if (!reader) return
      const decoder = new TextDecoder()
      let buffer = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = JSON.parse(line.slice(6))
          if (data.token) onToken(data.token)
          if (data.done) onDone()
        }
      }
    })
  },
}
