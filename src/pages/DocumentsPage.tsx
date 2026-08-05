import { useState, useEffect, useCallback } from "react"

import { MessageSquare, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer"
import { EmptyState } from "@/components/common/EmptyState"
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone"
import { DocumentListItem } from "@/components/documents/DocumentListItem"
import { VoiceRecorderButton } from "@/components/voice/VoiceRecorderButton"

import { documentsApi } from "@/lib/api/documents"
import { useToast } from "@/hooks/use-toast"
import { getApiErrorMessage } from "@/lib/api-client"
import type { Document, SourceChunk } from "@/types"

interface RagMessage {
  role: "user" | "assistant"
  content: string
  sources?: SourceChunk[]
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [activeDoc, setActiveDoc] = useState<Document | null>(null)
  const [messages, setMessages] = useState<RagMessage[]>([])
  const [query, setQuery] = useState("")
  const [asking, setAsking] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const { toast } = useToast()

  const load = useCallback(async () => {
    const { data } = await documentsApi.list()
    setDocuments(data.documents)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Poll processing documents every 3s
  useEffect(() => {
    const processing = documents.some((d) => d.status === "pending" || d.status === "processing")
    if (!processing) return
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [documents, load])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await documentsApi.upload(file)
      await load()
      toast({ title: "Uploaded!", description: "Document is being processed…" })
    } catch (err) {
      toast({ variant: "destructive", description: getApiErrorMessage(err) })
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleDelete = async (doc: Document) => {
    await documentsApi.delete(doc.id)
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    if (activeDoc?.id === doc.id) { setActiveDoc(null); setMessages([]) }
  }

  const handleAsk = async () => {
    if (!query.trim() || !activeDoc || asking) return
    const userMsg: RagMessage = { role: "user", content: query }
    setMessages((prev) => [...prev, userMsg])
    setQuery("")
    setAsking(true)
    try {
      const { data } = await documentsApi.ask(activeDoc.id, userMsg.content, sessionId)
      setSessionId(data.session_id)
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer, sources: data.sources }])
    } catch (err) {
      toast({ variant: "destructive", description: getApiErrorMessage(err) })
    } finally {
      setAsking(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-7rem)] flex gap-4">
      {/* Document list */}
      <div className="w-80 shrink-0 flex flex-col gap-3">
        <DocumentUploadZone uploading={uploading} onUpload={handleUpload} />

        <ScrollArea className="flex-1">
          {loading && [1,2,3].map(i => <Skeleton key={i} className="h-20 mb-2 rounded-xl" />)}
          {!loading && documents.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-8">No documents yet. Upload one to start chatting with it.</p>
          )}
          {documents.map((doc) => (
            <DocumentListItem
              key={doc.id}
              doc={doc}
              active={activeDoc?.id === doc.id}
              onSelect={() => { setActiveDoc(doc); setMessages([]); setSessionId(undefined) }}
              onDelete={() => handleDelete(doc)}
            />
          ))}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden">
        {!activeDoc ? (
          <EmptyState
            icon={MessageSquare}
            title="Select a document to chat with it"
            description="Answers will be grounded in your document's content."
            className="flex-1"
          />
        ) : (
          <>
            <div className="px-4 py-3 border-b border-border/60">
              <p className="text-sm font-medium">{activeDoc.filename}</p>
              <p className="text-xs text-muted-foreground">{activeDoc.chunk_count} chunks indexed · asking with RAG</p>
            </div>
            <ScrollArea className="flex-1 px-4">
              <div className="py-4 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card/80 border border-border/60 rounded-tl-sm"}`}>
                      {msg.role === "user" ? (
                        <p>{msg.content}</p>
                      ) : (
                        <>
                          <MarkdownRenderer content={msg.content} math={false} />
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/40">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Sources</p>
                              {msg.sources.map((s, si) => (
                                <div key={si} className="text-xs bg-muted/50 rounded-md p-2 mb-1.5">
                                  {s.page_number && <span className="text-primary font-medium mr-1">p.{s.page_number}</span>}
                                  <span className="text-muted-foreground">{s.snippet}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {asking && (
                  <div className="flex gap-1 py-2">
                    <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-border/60 flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAsk() }}
                placeholder="Ask a question about this document…"
                disabled={asking}
              />
              <VoiceRecorderButton onTranscript={(text) => setQuery((prev) => (prev ? `${prev} ${text}` : text))} disabled={asking} />
              <Button size="icon" onClick={handleAsk} disabled={asking || !query.trim()}>
                {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
