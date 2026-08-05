import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Loader2, RotateCcw, ThumbsUp, ThumbsDown, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { FlipCard } from "@/components/flashcards/FlipCard"
import { flashcardsApi } from "@/lib/api/flashcards"
import { useToast } from "@/hooks/use-toast"
import { getApiErrorMessage } from "@/lib/api-client"
import type { FlashcardDeckListItem, Flashcard } from "@/types"

type Mode = "list" | "review"

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<FlashcardDeckListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [form, setForm] = useState({ title: "", subject: "", text: "", count: 10 })
  const [mode, setMode] = useState<Mode>("list")
  const [dueCards, setDueCards] = useState<Flashcard[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [, setActiveDeckId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    flashcardsApi.listDecks().then(({ data }) => { setDecks(data); setLoading(false) })
  }, [])

  const generate = async () => {
    if (!form.title || !form.text) return
    setGenerating(true)
    try {
      const { data } = await flashcardsApi.generate({ title: form.title, subject: form.subject || undefined, source_type: "typed_text", typed_text: form.text, num_cards: form.count })
      flashcardsApi.listDecks().then(({ data }) => setDecks(data))
      setShowGenerate(false)
      toast({ title: `${data.cards.length} cards generated!` })
    } catch (err) {
      toast({ variant: "destructive", description: getApiErrorMessage(err) })
    } finally {
      setGenerating(false)
    }
  }

  const startReview = async (deckId?: string) => {
    const { data } = await flashcardsApi.getDue(deckId)
    if (data.length === 0) { toast({ description: "No cards due right now — come back later!" }); return }
    setDueCards(data)
    setCurrentIdx(0)
    setFlipped(false)
    setActiveDeckId(deckId || null)
    setMode("review")
  }

  const handleMark = async (marked: "easy" | "hard") => {
    const card = dueCards[currentIdx]
    await flashcardsApi.review(card.id, marked)
    if (currentIdx + 1 >= dueCards.length) {
      setMode("list")
      flashcardsApi.listDecks().then(({ data }) => setDecks(data))
      toast({ title: "Session complete!", description: `Reviewed ${dueCards.length} cards.` })
    } else {
      setCurrentIdx((i) => i + 1)
      setFlipped(false)
    }
  }

  if (mode === "review") {
    const card = dueCards[currentIdx]
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{currentIdx + 1}/{dueCards.length} cards</p>
          <Button variant="ghost" size="sm" onClick={() => setMode("list")}>Exit</Button>
        </div>
        <Progress value={((currentIdx) / dueCards.length) * 100} />
        <FlipCard card={card} flipped={flipped} onFlip={() => setFlipped(!flipped)} />
        {flipped && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
            <Button variant="outline" className="flex-1 gap-2 border-destructive/40 hover:bg-destructive/10 text-destructive" onClick={() => handleMark("hard")}>
              <ThumbsDown className="h-4 w-4" /> Hard
            </Button>
            <Button className="flex-1 gap-2 bg-success/15 text-success hover:bg-success/20 border border-success/30" onClick={() => handleMark("easy")}>
              <ThumbsUp className="h-4 w-4" /> Easy
            </Button>
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Flashcards</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => startReview()} className="gap-2"><RotateCcw className="h-4 w-4" /> Review Due</Button>
          <Button onClick={() => setShowGenerate(true)} className="gap-2"><Plus className="h-4 w-4" /> Generate Deck</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && [1,2,3].map(i => <Card key={i}><CardContent className="p-5 space-y-2"><div className="h-4 bg-muted rounded animate-pulse" /><div className="h-4 w-1/2 bg-muted rounded animate-pulse" /></CardContent></Card>)}
        {!loading && decks.length === 0 && <p className="col-span-full text-center text-muted-foreground text-sm py-12">No decks yet. Generate your first one!</p>}
        {decks.map(d => (
          <Card key={d.id} className="cursor-pointer hover:ring-2 hover:ring-primary/50" onClick={() => startReview(d.id)}>
            <CardContent className="p-5">
              <div className="flex items-start gap-2">
                <Layers className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{d.title}</p>
                  {d.subject && <Badge variant="secondary" className="mt-1 text-xs">{d.subject}</Badge>}
                </div>
              </div>
              <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                <span>{d.card_count} cards</span>
                {d.due_count > 0 && <Badge variant="warning" className="text-xs">{d.due_count} due</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Flashcard Deck</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Deck name</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Source text</Label><Textarea rows={5} value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} placeholder="Paste the content to make flashcards from…" /></div>
            <div className="space-y-2"><Label>Number of cards</Label><Input type="number" min={1} max={50} value={form.count} onChange={e => setForm(p => ({ ...p, count: Number(e.target.value) }))} /></div>
            <Button className="w-full" onClick={generate} disabled={generating || !form.title || !form.text}>
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</> : "Generate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
