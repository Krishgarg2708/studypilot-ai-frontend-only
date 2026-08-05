import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface MarkdownRendererProps {
  content: string
  /** Skip math/KaTeX parsing for contexts that don't need it (slightly cheaper). */
  math?: boolean
}

/** Renders AI-generated markdown consistently everywhere it appears: chat messages,
 * document Q&A answers, and the "Explanation" tab of Smart Notes. Centralizing this
 * means code blocks, tables, and LaTeX all look and behave the same across the app. */
export function MarkdownRenderer({ content, math = true }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={math ? [remarkGfm, remarkMath] : [remarkGfm]}
        rehypePlugins={math ? [rehypeKatex] : []}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            const inline = !match
            return inline ? (
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            ) : (
              <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div">
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
