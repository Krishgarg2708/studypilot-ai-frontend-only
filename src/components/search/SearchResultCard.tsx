import { FileText, StickyNote, HelpCircle, Layers, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow, parseISO } from "date-fns"
import type { SearchResultItem } from "@/types"

const TYPE_ICON: Record<string, React.ElementType> = {
  document: FileText,
  note: StickyNote,
  quiz: HelpCircle,
  flashcard_deck: Layers,
  chat_session: MessageSquare,
}

interface SearchResultCardProps {
  item: SearchResultItem
  onClick: () => void
}

/** One result row in the Search page — shows the matched item's type, subject, and (for
 * semantic search) a relevance score, plus a content snippet. */
export function SearchResultCard({ item, onClick }: SearchResultCardProps) {
  const Icon = TYPE_ICON[item.type] ?? FileText
  return (
    <Card className="cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all" onClick={onClick}>
      <CardContent className="p-4 flex gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm truncate">{item.title}</p>
            <Badge variant="secondary" className="text-xs capitalize shrink-0">
              {item.type.replace("_", " ")}
            </Badge>
            {item.subject && <Badge variant="outline" className="text-xs shrink-0">{item.subject}</Badge>}
            {item.score != null && (
              <Badge variant="outline" className="text-xs shrink-0 text-success border-success/40">
                {Math.round(item.score * 100)}% match
              </Badge>
            )}
          </div>
          {item.snippet && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.snippet}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(parseISO(item.created_at), { addSuffix: true })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
