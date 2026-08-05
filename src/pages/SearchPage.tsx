import { useState, useCallback } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchResultCard } from "@/components/search/SearchResultCard"
import { searchApi } from "@/lib/api/search"
import { useNavigate } from "react-router-dom"
import type { SearchResultItem } from "@/types"

const TYPE_ROUTE: Record<string, string> = {
  document: "/documents",
  note: "/notes",
  quiz: "/quizzes",
  flashcard_deck: "/flashcards",
  chat_session: "/chat",
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"keyword" | "semantic">("keyword")
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const navigate = useNavigate()

  const doSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setHasSearched(true)
    try {
      const { data } = mode === "semantic"
        ? await searchApi.semantic(query)
        : await searchApi.keyword(query)
      setResults(data.results)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, mode])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Search</h1>
        <p className="text-sm text-muted-foreground mt-1">Search across your documents, notes, quizzes, and more.</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search your study materials…"
            className="pl-9"
            autoFocus
          />
        </div>
        <Button onClick={doSearch} disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as "keyword" | "semantic")}>
        <TabsList>
          <TabsTrigger value="keyword">Keyword</TabsTrigger>
          <TabsTrigger value="semantic">Semantic (AI)</TabsTrigger>
        </TabsList>
        <p className="text-xs text-muted-foreground mt-2">
          {mode === "keyword"
            ? "Finds exact title/content matches across all your study materials."
            : "Searches document content by meaning — finds relevant chunks even without exact keyword matches."}
        </p>
      </Tabs>

      {hasSearched && !loading && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {results.length === 0 ? "No results found." : `${results.length} result${results.length !== 1 ? "s" : ""}`}
          </p>
          <div className="space-y-3">
            {results.map((item) => (
              <SearchResultCard
                key={`${item.type}-${item.id}`}
                item={item}
                onClick={() => navigate(TYPE_ROUTE[item.type] ?? "/")}
              />
            ))}
          </div>
        </div>
      )}

      {!hasSearched && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Type something to search across all your study materials.</p>
        </div>
      )}
    </div>
  )
}
