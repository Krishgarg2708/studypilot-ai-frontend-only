import { apiClient } from "@/lib/api-client"
import type { StudyPlan, StudyPlanListItem, StudyPlanItem } from "@/types"

export const studyPlanApi = {
  create: (payload: {
    title: string
    exam_date: string
    subjects: { name: string; weak: boolean; target_marks?: number }[]
    daily_study_hours: number
  }) => apiClient.post<StudyPlan>("/study-plans", payload),
  list: () => apiClient.get<StudyPlanListItem[]>("/study-plans"),
  get: (id: string) => apiClient.get<StudyPlan>(`/study-plans/${id}`),
  delete: (id: string) => apiClient.delete(`/study-plans/${id}`),
  toggleItem: (itemId: string, is_completed: boolean) =>
    apiClient.patch<StudyPlanItem>(`/study-plans/items/${itemId}`, { is_completed }),
  getCalendar: (id: string) => apiClient.get<Record<string, StudyPlanItem[]>>(`/study-plans/${id}/calendar`),
}
