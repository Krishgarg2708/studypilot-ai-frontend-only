import { useState, useEffect, useRef } from "react"
import { Send, Bot, Loader2, Plus, Trash2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { VoiceRecorderButton } from "@/components/voice/VoiceRecorderButton"
import { EmptyState } from "@/components/common/EmptyState"
import { chatApi } from "@/lib/api/chat"
import { useAuthStore } from "@/store/auth-store"
import { getApiErrorMessage } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { ChatSession, ChatMessage } from "@/types"

const QUICK_ACTIONS = [
  { action: "explain", label: "Explain" },
  { action: "explain_step_by_step", label: "Step-by-step" },
  { action: "explain_with_analogy", label: "Analogy" },
  { action: "generate_examples", label: "Examples" },
  { action: "generate_interview_questions", label: "Interview Qs" },
  { action: "solve_coding_problem", label: "Code Help" },
]

const MODES = [
  { value: "general", label: "General" },
  { value: "exam_mode", label: "Exam Mode" },
  { value: "interview_mode", label: "Interview Mode" },
  { value: "revision_mode", label: "Revision Mode" },
]

export default function ChatPage() {
  const user = useAuthStore((s) => s.user)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<(ChatSession & { messages: ChatMessage[] }) | null>(null)
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState("")
  const [mode, setMode] = useState("general")
  const [loadingSessions, setLoadingSessions] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    chatApi.listSessions().then(({ data }) => {
      setSessions(data)
      setLoadingSessions(false)
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeSession?.messages, streamBuffer])

  const createSession = async () => {
    try {
      const { data } = await chatApi.createSession(mode)
      setSessions((prev) => [data, ...prev])
      const full = await chatApi.getSession(data.id)
      setActiveSession(full.data)
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: getApiErrorMessage(e) })
    }
  }

  const loadSession = async (id: string) => {
    const { data } = await chatApi.getSession(id)
    setActiveSession(data)
  }

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return
    let session = activeSession
    if (!session) {
      const { data } = await chatApi.createSession(mode)
      const full = await chatApi.getSession(data.id)
      session = full.data
      setActiveSession(session)
      setSessions((prev) => [data, ...prev])
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      source_chunks: null,
      created_at: new Date().toISOString(),
    }
    setActiveSession((prev) => prev ? { ...prev, messages: [...prev.messages, userMsg] } : null)
    setInput("")
    setIsStreaming(true)
    setStreamBuffer("")

    let accumulated = ""
    try {
      await chatApi.streamMessage(
        session.id,
        userMsg.content,
        user?.preferred_model,
        (token) => {
          accumulated += token
          setStreamBuffer(accumulated)
        },
        () => {
          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: accumulated,
            source_chunks: null,
            created_at: new Date().toISOString(),
          }
          setActiveSession((prev) =>
            prev ? { ...prev, messages: [...prev.messages, assistantMsg] } : null
          )
          setStreamBuffer("")
          setIsStreaming(false)
        }
      )
    } catch (e) {
      toast({ variant: "destructive", title: "AI unavailable", description: getApiErrorMessage(e) })
      setIsStreaming(false)
      setStreamBuffer("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleQuickAction = async (action: string) => {
    if (!input.trim()) {
      toast({ description: "Enter a topic first." })
      return
    }
    setIsStreaming(true)
    setStreamBuffer("")
    let session = activeSession
    if (!session) {
      const { data } = await chatApi.createSession(mode)
      const full = await chatApi.getSession(data.id)
      session = full.data
      setActiveSession(session)
      setSessions((prev) => [data, ...prev])
    }
    const topic = input
    setInput("")
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: `${action.replace(/_/g, " ")}: ${topic}`,
      source_chunks: null,
      created_at: new Date().toISOString(),
    }
    setActiveSession((prev) => prev ? { ...prev, messages: [...prev.messages, userMsg] } : null)
    try {
      const { data } = await chatApi.quickAction(action, topic, session?.id, user?.preferred_model)
      setActiveSession((prev) =>
        prev ? { ...prev, messages: [...prev.messages, data] } : null
      )
    } catch (e) {
      toast({ variant: "destructive", description: getApiErrorMessage(e) })
    } finally {
      setIsStreaming(false)
      setStreamBuffer("")
    }
  }

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await chatApi.deleteSession(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (activeSession?.id === id) setActiveSession(null)
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-4">
      {/* Session list */}
      <div className="hidden lg:flex w-64 shrink-0 flex-col glass-panel rounded-2xl p-3">
        <div className="flex items-center justify-between px-2 py-1 mb-2">
          <span className="text-sm font-medium">Conversations</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={createSession}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {loadingSessions && [1, 2, 3].map((i) => <Skeleton key={i} className="h-10 mb-2 rounded-lg" />)}
          {!loadingSessions && sessions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-8">No conversations yet.</p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => loadSession(s.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-colors mb-1 group ${
                activeSession?.id === s.id ? "bg-primary/15 text-primary" : "hover:bg-accent text-muted-foreground"
              }`}
            >
              <span className="flex-1 truncate">{s.title}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => deleteSession(s.id, e)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-0.5">
            {QUICK_ACTIONS.map((qa) => (
              <Badge
                key={qa.action}
                variant="outline"
                className="cursor-pointer shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => handleQuickAction(qa.action)}
              >
                <Zap className="h-3 w-3 mr-1" /> {qa.label}
              </Badge>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-6">
            {!activeSession && !isStreaming && (
              <EmptyState
                icon={Bot}
                title="Start a conversation"
                description="Powered by local Ollama — fully offline."
                className="h-64"
              />
            )}
            {activeSession?.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isStreaming && streamBuffer && (
              <MessageBubble
                message={{ id: "stream", role: "assistant", content: streamBuffer, source_chunks: null, created_at: "" }}
                isStreaming
              />
            )}
            {isStreaming && !streamBuffer && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-center gap-1 py-2">
                  <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/60">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
              className="resize-none min-h-[48px] max-h-36"
              rows={1}
            />
            <VoiceRecorderButton onTranscript={(text) => setInput((prev) => (prev ? `${prev} ${text}` : text))} disabled={isStreaming} />
            <Button size="icon" onClick={sendMessage} disabled={isStreaming || !input.trim()} className="shrink-0 h-10 w-10">
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
