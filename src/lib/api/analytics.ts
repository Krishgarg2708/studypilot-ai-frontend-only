import { apiClient } from "@/lib/api-client"
import type { AnalyticsSummary, DailyActivity } from "@/types"

export const analyticsApi = {
  getSummary: (days: number = 30) => apiClient.get<AnalyticsSummary>("/analytics/summary", { params: { days } }),
  setDailyGoal: (goal_minutes: number) => apiClient.post<DailyActivity>("/analytics/daily-goal", { goal_minutes }),
  logPomodoro: (payload: {
    session_type: "focus" | "short_break" | "long_break"
    planned_duration_minutes: number
    actual_duration_seconds: number
    was_completed: boolean
    subject?: string
    started_at: string
    ended_at: string
  }) => apiClient.post("/pomodoro/sessions", payload),
}
