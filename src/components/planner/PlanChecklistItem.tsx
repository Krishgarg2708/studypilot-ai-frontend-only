import { CheckCircle, Circle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { StudyPlanItem } from "@/types"

const ITEM_TYPE_COLOR: Record<string, string> = {
  study: "bg-primary/15 text-primary",
  revision: "bg-amber-500/15 text-amber-600",
  practice_quiz: "bg-violet-500/15 text-violet-600",
  break: "bg-muted text-muted-foreground",
}

interface PlanChecklistItemProps {
  item: StudyPlanItem
  onToggle: () => void
  showDuration?: boolean
}

/** A single checkable task in the Study Planner (today's tasks list and the day-by-day
 * calendar). Clicking anywhere on the row toggles completion. */
export function PlanChecklistItem({ item, onToggle, showDuration }: PlanChecklistItemProps) {
  return (
    <div
      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent cursor-pointer"
      onClick={onToggle}
    >
      {item.is_completed ? (
        <CheckCircle className="h-4 w-4 text-success shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <div className="flex-1">
        <p className={`text-sm ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>{item.title}</p>
        {showDuration && <p className="text-xs text-muted-foreground">{item.duration_minutes}m</p>}
      </div>
      <Badge className={`text-xs ${ITEM_TYPE_COLOR[item.item_type]}`}>{item.item_type.replace("_", " ")}</Badge>
    </div>
  )
}
