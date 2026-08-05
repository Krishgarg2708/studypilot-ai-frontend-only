import { useEffect, useState } from "react"
import { Flame, Clock, CheckCircle, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/analytics/StatCard"
import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap"
import { analyticsApi } from "@/lib/api/analytics"
import type { AnalyticsSummary } from "@/types"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { format, parseISO } from "date-fns"

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi.getSummary(30).then(({ data }) => { setSummary(data); setLoading(false) })
  }, [])

  const stats = summary ? [
    { icon: Flame, label: "Study Streak", value: `${summary.study_streak_days} days`, color: "text-orange-500 bg-orange-500/10" },
    { icon: Clock, label: "Study Time (30d)", value: `${Math.round(summary.total_study_minutes_30d / 60)}h`, color: "text-blue-500 bg-blue-500/10" },
    { icon: CheckCircle, label: "Pomodoros (30d)", value: String(summary.total_pomodoros_30d), color: "text-emerald-500 bg-emerald-500/10" },
    { icon: TrendingUp, label: "Quiz Accuracy", value: `${summary.average_quiz_accuracy}%`, color: "text-violet-500 bg-violet-500/10" },
  ] : []

  const chartData = summary?.daily_activity.map((d) => ({
    date: format(parseISO(d.activity_date), "MMM d"),
    minutes: d.study_minutes,
    goal: d.daily_goal_minutes,
  })) ?? []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : stats.map(({ icon, label, value, color }) => (
              <StatCard key={label} icon={icon} label={label} value={value} colorClass={color} />
            ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Daily Study Time (last 30 days)</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-52 w-full" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Minutes" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Activity heatmap (simplified) */}
      <Card>
        <CardHeader><CardTitle className="text-base">Activity Heatmap</CardTitle></CardHeader>
        <CardContent>
          <ActivityHeatmap dailyActivity={summary?.daily_activity ?? []} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Weak Subjects</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-24" /> : summary?.weak_subjects.length === 0
              ? <p className="text-sm text-muted-foreground">No data yet — take quizzes with subject tags.</p>
              : <div className="space-y-3">{summary?.weak_subjects.map(s => (
                  <div key={s.subject} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{s.subject}</span>
                        <span className="text-muted-foreground">{s.accuracy_percent}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-destructive/70 rounded-full" style={{ width: `${s.accuracy_percent}%` }} />
                      </div>
                    </div>
                  </div>
                ))}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Strong Subjects</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-24" /> : summary?.strong_subjects.length === 0
              ? <p className="text-sm text-muted-foreground">No data yet.</p>
              : <div className="space-y-3">{summary?.strong_subjects.map(s => (
                  <div key={s.subject} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{s.subject}</span>
                        <span className="text-muted-foreground">{s.accuracy_percent}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-success/70 rounded-full" style={{ width: `${s.accuracy_percent}%` }} />
                      </div>
                    </div>
                  </div>
                ))}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
