import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  colorClass: string
}

/** One metric tile on the Analytics dashboard (streak, study time, pomodoros, accuracy). */
export function StatCard({ icon: Icon, label, value, colorClass }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
