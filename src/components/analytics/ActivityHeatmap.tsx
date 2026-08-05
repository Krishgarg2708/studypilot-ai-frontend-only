import type { DailyActivity } from "@/types"

interface ActivityHeatmapProps {
  dailyActivity: DailyActivity[]
}

/** Simplified GitHub-style activity heatmap: one square per day, darker = more study
 * minutes. Falls back to 30 empty placeholder squares while data is loading. */
export function ActivityHeatmap({ dailyActivity }: ActivityHeatmapProps) {
  const days = dailyActivity.length > 0 ? dailyActivity : Array(30).fill(null)
  return (
    <div>
      <div className="flex gap-1 flex-wrap">
        {days.map((d, i) => (
          <div
            key={i}
            title={d ? `${d.activity_date}: ${d.study_minutes}m` : ""}
            className="h-5 w-5 rounded-sm"
            style={{
              backgroundColor: d?.study_minutes
                ? `hsl(var(--primary) / ${Math.min(1, d.study_minutes / 120)})`
                : "hsl(var(--muted))",
            }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">Each square = one day. Darker = more study time.</p>
    </div>
  )
}
