import { motion } from "framer-motion"
import { Bot, User } from "lucide-react"
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer"
import type { ChatMessage } from "@/types"

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
}

/** A single chat message bubble (user or assistant), with markdown/code/math rendering
 * for assistant replies. Extracted from ChatPage so it can be reused anywhere a chat
 * transcript needs to be shown (e.g. a future "shared conversation" view). */
export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user"
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-primary/15" : "bg-muted"}`}>
        {isUser ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card/80 border border-border/60 rounded-tl-sm"}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <MarkdownRenderer content={message.content} />
            {isStreaming && <span className="inline-block w-2 h-4 bg-current opacity-60 animate-pulse ml-0.5" />}
          </>
        )}
      </div>
    </motion.div>
  )
}
