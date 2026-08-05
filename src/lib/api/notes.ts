import { apiClient } from "@/lib/api-client"
import type { Note, NoteListItem } from "@/types"

export const notesApi = {
  generate: (payload: {
    source_type: "document" | "typed_text" | "chapter"
    title: string
    subject?: string
    document_id?: string
    typed_text?: string
    chapter_name?: string
    model?: string
  }) => apiClient.post<Note>("/notes/generate", payload),
  list: (subject?: string) => apiClient.get<NoteListItem[]>("/notes", { params: { subject } }),
  get: (id: string) => apiClient.get<Note>(`/notes/${id}`),
  delete: (id: string) => apiClient.delete(`/notes/${id}`),
  export: (id: string, format: "pdf" | "markdown" | "docx") =>
    apiClient.post(`/notes/${id}/export`, { format }, { responseType: "blob" }),
}
