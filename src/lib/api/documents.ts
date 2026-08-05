import { apiClient } from "@/lib/api-client"
import type { Document, SourceChunk } from "@/types"

export const documentsApi = {
  upload: (file: File, subject?: string) => {
    const formData = new FormData()
    formData.append("file", file)
    if (subject) formData.append("subject", subject)
    return apiClient.post<Document>("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  list: (subject?: string) =>
    apiClient.get<{ documents: Document[]; total: number }>("/documents", { params: { subject } }),
  get: (id: string) => apiClient.get<Document>(`/documents/${id}`),
  delete: (id: string) => apiClient.delete(`/documents/${id}`),
  ask: (id: string, query: string, session_id?: string, model?: string) =>
    apiClient.post<{ answer: string; sources: SourceChunk[]; session_id: string }>(`/documents/${id}/ask`, {
      query,
      session_id,
      model,
    }),
}
