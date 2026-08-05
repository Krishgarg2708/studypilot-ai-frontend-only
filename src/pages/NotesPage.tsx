import { useState, useEffect } from "react"

import { Plus, FileText, Trash2, Download, Loader2, ChevronRight, Book } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer"
import { MindMapView } from "@/components/notes/MindMapView"
import { EmptyState } from "@/components/common/EmptyState"
import { ReadAloudButton } from "@/components/voice/ReadAloudButton"
import { notesApi } from "@/lib/api/notes"
import { useToast } from "@/hooks/use-toast"
import { getApiErrorMessage } from "@/lib/api-client"
import type { Note, NoteListItem } from "@/types"

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteListItem[]>([])
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [form, setForm] = useState({ title: "", subject: "", typed_text: "" })
  const { toast } = useToast()

  useEffect(() => {
    notesApi.list().then(({ data }) => { setNotes(data); setLoading(false) })
  }, [])

  const loadNote = async (id: string) => {
    const { data } = await notesApi.get(id)
    setActiveNote(data)
  }

  const generate = async () => {
    if (!form.title.trim() || !form.typed_text.trim()) return
    setGenerating(true)
    try {
      const { data } = await notesApi.generate({ source_type: "typed_text", title: form.title, subject: form.subject || undefined, typed_text: form.typed_text })
      setNotes((prev) => [{ id: data.id, title: data.title, subject: data.subject, source_type: data.source_type, created_at: data.created_at }, ...prev])
      setActiveNote(data)
      setShowGenerate(false)
      setForm({ title: "", subject: "", typed_text: "" })
      toast({ title: "Notes generated!" })
    } catch (err) {
      toast({ variant: "destructive", description: getApiErrorMessage(err) })
    } finally {
      setGenerating(false)
    }
  }

  const exportNote = async (format: "pdf" | "markdown" | "docx") => {
    if (!activeNote) return
    try {
      const { data } = await notesApi.export(activeNote.id, format)
      const url = URL.createObjectURL(new Blob([data]))
      const a = document.createElement("a")
      a.href = url
      a.download = `${activeNote.title}.${format === "markdown" ? "md" : format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast({ variant: "destructive", description: getApiErrorMessage(err) })
    }
  }

  const deleteNote = async (id: string) => {
    await notesApi.delete(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (activeNote?.id === id) setActiveNote(null)
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-7rem)] flex gap-4">
      {/* Note list */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        <Button onClick={() => setShowGenerate(true)} className="w-full gap-2">
          <Plus className="h-4 w-4" /> Generate Notes
        </Button>
        <ScrollArea className="flex-1">
          {loading && [1,2,3].map(i => <Skeleton key={i} className="h-20 mb-2 rounded-xl" />)}
          {!loading && notes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-8">No notes yet. Generate some!</p>
          )}
          {notes.map((note) => (
            <Card key={note.id} onClick={() => loadNote(note.id)} className={`mb-2 cursor-pointer ${activeNote?.id === note.id ? "ring-2 ring-primary" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Book className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{note.title}</p>
                    {note.subject && <Badge variant="secondary" className="mt-1 text-xs">{note.subject}</Badge>}
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </ScrollArea>
      </div>

      {/* Note detail */}
      <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col">
        {!activeNote ? (
          <EmptyState icon={FileText} title="Select or generate a note" className="flex-1" />
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
              <div>
                <p className="font-semibold">{activeNote.title}</p>
                {activeNote.subject && <Badge variant="secondary" className="mt-0.5 text-xs">{activeNote.subject}</Badge>}
              </div>
              <div className="flex gap-2">
                <ReadAloudButton noteId={activeNote.id} label="Read aloud" />
                {(["pdf", "markdown", "docx"] as const).map((f) => (
                  <Button key={f} size="sm" variant="outline" onClick={() => exportNote(f)} className="gap-1">
                    <Download className="h-3 w-3" /> {f.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
            <ScrollArea className="flex-1 p-5">
              <Tabs defaultValue="summary">
                <TabsList className="mb-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="explanation">Explanation</TabsTrigger>
                  <TabsTrigger value="concepts">Key Concepts</TabsTrigger>
                  <TabsTrigger value="more">More</TabsTrigger>
                </TabsList>

                <TabsContent value="summary">
                  <p className="text-sm leading-relaxed">{activeNote.content.summary}</p>
                </TabsContent>

                <TabsContent value="explanation">
                  <MarkdownRenderer content={activeNote.content.detailed_explanation} math={false} />
                </TabsContent>

                <TabsContent value="concepts">
                  <div className="space-y-2">
                    {activeNote.content.key_concepts.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm py-2 border-b border-border/40 last:border-0">
                        <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="more">
                  <div className="space-y-6">
                    {[
                      { title: "Examples", items: activeNote.content.examples },
                      { title: "Common Mistakes", items: activeNote.content.common_mistakes },
                      { title: "Revision Tips", items: activeNote.content.revision_tips },
                      { title: "Formula Sheet", items: activeNote.content.formula_sheet },
                      { title: "Interview Questions", items: activeNote.content.interview_questions },
                    ].map(({ title, items }) => (
                      <div key={title}>
                        <h3 className="text-sm font-semibold mb-2">{title}</h3>
                        <ul className="space-y-1.5">
                          {items.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-primary">·</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {activeNote.content.mermaid_mind_map && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Mind Map</h3>
                        <MindMapView mermaidSource={activeNote.content.mermaid_mind_map} />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </>
        )}
      </div>

      {/* Generate dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Smart Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Photosynthesis" />
            </div>
            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Biology" />
            </div>
            <div className="space-y-2">
              <Label>Source text / chapter content</Label>
              <Textarea value={form.typed_text} onChange={e => setForm(p => ({ ...p, typed_text: e.target.value }))} rows={6} placeholder="Paste your notes, textbook excerpt, or topic description here…" />
            </div>
            <Button className="w-full" onClick={generate} disabled={generating || !form.title || !form.typed_text}>
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</> : "Generate Notes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
