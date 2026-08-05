import { apiClient } from "@/lib/api-client"
import type { Quiz, QuizListItem, QuizAttemptResult, QuestionType, Difficulty } from "@/types"

export const quizApi = {
  generate: (payload: {
    title: string
    subject?: string
    source_type: "document" | "typed_text"
    document_id?: string
    typed_text?: string
    question_types: QuestionType[]
    difficulty: Difficulty
    num_questions: number
    model?: string
  }) => apiClient.post<Quiz>("/quizzes/generate", payload),
  list: (subject?: string) => apiClient.get<QuizListItem[]>("/quizzes", { params: { subject } }),
  get: (id: string) => apiClient.get<Quiz>(`/quizzes/${id}`),
  delete: (id: string) => apiClient.delete(`/quizzes/${id}`),
  submit: (id: string, answers: Record<string, string>, time_taken_seconds?: number) =>
    apiClient.post<QuizAttemptResult>(`/quizzes/${id}/submit`, { answers, time_taken_seconds }),
}
