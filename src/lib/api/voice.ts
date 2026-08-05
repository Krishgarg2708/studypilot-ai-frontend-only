import { apiClient, tokenStorage } from "@/lib/api-client"

export interface TranscriptionResponse {
  text: string
  language: string | null
  duration_seconds: number
}

export const voiceApi = {
  /** Speech-to-text: uploads a recorded audio blob and returns the transcribed text. */
  transcribe: (audioBlob: Blob) => {
    const formData = new FormData()
    formData.append("file", audioBlob, "recording.webm")
    return apiClient.post<TranscriptionResponse>("/voice/transcribe", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },

  /** Text-to-speech: returns a playable audio Blob (WAV) for the given text. */
  speak: async (text: string, voice?: string): Promise<Blob> => {
    const token = tokenStorage.getAccessToken()
    const response = await fetch("/api/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text, voice }),
    })
    if (!response.ok) throw new Error("Text-to-speech request failed")
    return response.blob()
  },

  /** Reads a saved note's summary + explanation aloud, returning a playable audio Blob. */
  readNoteAloud: async (noteId: string): Promise<Blob> => {
    const token = tokenStorage.getAccessToken()
    const response = await fetch(`/api/voice/read-note/${noteId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error("Read-aloud request failed")
    return response.blob()
  },
}
