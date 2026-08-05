import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Flame, Clock, Target, TrendingUp, MessageSquare, StickyNote, HelpCircle, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { useAuthStore } from "@/store/auth-store"
import { analyticsApi } from "@/lib/api/analytics"
import type { AnalyticsSummary } from "@/types"

const quickActions = [
  { to: "/chat", icon: MessageSquare, label: "Ask AI", color: "text-blue-500 bg-blue-500/10" },
  { to: "/notes", icon: StickyNote, label: "Generate Notes", color: "text-amber-500 bg-amber-500/10" },
  { to: "/quizzes", icon: HelpCircle, label: "Take a Quiz", color: "text-violet-500 bg-violet-500/10" },
  { to: "/flashcards", icon: Layers, label: "Review Cards", color: "text-emerald-500 bg-emerald-500/10" },
]

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi
      .getSummary(7)
      .then(({ data }) => setSummary(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const today = summary?.daily_activity[summary.daily_activity.length - 1]
  const goalProgress = today ? Math.min(100, Math.round((today.study_minutes / today.daily_goal_minutes) * 100)) : 0

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">Here's where your studying stands today.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Flame}
          label="Study Streak"
          value={loading ? null : `${summary?.study_streak_days ?? 0} days`}
          accent="text-orange-500 bg-orange-500/10"
        />
        <StatCard
          icon={Clock}
          label="Study Time (7d)"
          value={loading ? null : `${Math.round((summary?.total_study_minutes_30d ?? 0) / 60)}h`}
          accent="text-blue-500 bg-blue-500/10"
        />
        <StatCard
          icon={Target}
          label="Today's Goal"
          value={loading ? null : `${goalProgress}%`}
          accent="text-emerald-500 bg-emerald-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Quiz Accuracy"
          value={loading ? null : `${summary?.average_quiz_accuracy ?? 0}%`}
          accent="text-violet-500 bg-violet-500/10"
        />
      </div>

      {today && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {today.study_minutes} / {today.daily_goal_minutes} minutes
              </span>
              <span className="font-medium">{goalProgress}%</span>
            </div>
            <Progress value={goalProgress} />
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to}>
              <Card className="hover:scale-[1.02] transition-transform cursor-pointer h-full">
                <CardContent className="p-5 flex flex-col items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {summary && (summary.weak_subjects.length > 0 || summary.strong_subjects.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Needs attention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.weak_subjects.length === 0 && (
                <p className="text-sm text-muted-foreground">No weak subjects identified yet — keep taking quizzes!</p>
              )}
              {summary.weak_subjects.map((s) => (
                <div key={s.subject} className="flex items-center justify-between text-sm">
                  <span>{s.subject}</span>
                  <span className="text-muted-foreground">{s.accuracy_percent}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Strong subjects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.strong_subjects.length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet — take a quiz to see your strengths.</p>
              )}
              {summary.strong_subjects.map((s) => (
                <div key={s.subject} className="flex items-center justify-between text-sm">
                  <span>{s.subject}</span>
                  <span className="text-success font-medium">{s.accuracy_percent}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | null
  accent: string
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          {value === null ? <Skeleton className="h-6 w-16 mt-1" /> : <p className="text-lg font-semibold">{value}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
