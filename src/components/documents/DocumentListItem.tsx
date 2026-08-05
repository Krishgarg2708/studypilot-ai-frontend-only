import { FileText, Trash2, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Document } from "@/types"

const STATUS_ICON = {
  pending: <Clock className="h-3 w-3 text-muted-foreground" />,
  processing: <Loader2 className="h-3 w-3 animate-spin text-primary" />,
  ready: <CheckCircle className="h-3 w-3 text-success" />,
  failed: <AlertCircle className="h-3 w-3 text-destructive" />,
}

interface DocumentListItemProps {
  doc: Document
  active: boolean
  onSelect: () => void
  onDelete: () => void
}

/** A single uploaded document in the sidebar list, showing processing status and
 * letting the user select it (once ready) or delete it. */
export function DocumentListItem({ doc, active, onSelect, onDelete }: DocumentListItemProps) {
  return (
    <Card
      onClick={() => { if (doc.status === "ready") onSelect() }}
      className={`mb-2 cursor-pointer transition-all ${active ? "ring-2 ring-primary" : ""} ${doc.status !== "ready" ? "opacity-70" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{doc.filename}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {STATUS_ICON[doc.status]}
              <span className="text-xs text-muted-foreground capitalize">{doc.status}</span>
              {doc.page_count && <span className="text-xs text-muted-foreground">· {doc.page_count}p</span>}
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
