import { useState, useEffect, useRef } from "react"
import { CheckCircle, XCircle, Plus, Loader2, Trophy, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { QuizQuestionCard } from "@/components/quiz/QuizQuestionCard"
import { quizApi } from "@/lib/api/quiz"
import { useToast } from "@/hooks/use-toast"
import { getApiErrorMessage } from "@/lib/api-client"
import type { Quiz, QuizListItem, QuizAttemptResult } from "@/types"

type Phase = "list" | "taking" | "results"

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [form, setForm] = useState({ title: "", subject: "", text: "", difficulty: "medium", types: ["mcq"], count: 5 })
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [phase, setPhase] = useState<Phase>("list")
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<QuizAttemptResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const startTime = useRef<number>(0)
  const { toast } = useToast()

  useEffect(() => {
    quizApi.list().then(({ data }) => { setQuizzes(data); setLoading(false) })
  }, [])

  const generate = async () => {
    if (!form.title || !form.text) return
    setGenerating(true)
    try {
      const { data } = await quizApi.generate({
        title: form.title, subject: form.subject || undefined, source_type: "typed_text",
        typed_text: form.text, question_types: form.types as any[], difficulty: form.difficulty as any, num_questions: form.count,
      })
      setQuizzes(prev => [{ id: data.id, title: data.title, subject: data.subject, difficulty: data.difficulty, created_at: data.created_at }, ...prev])
      setShowGenerate(false)
      setActiveQuiz(data)
      setAnswers({})
      startTime.current = Date.now()
      setPhase("taking")
    } catch (err) {
      toast({ variant: "destructive", description: getApiErrorMessage(err) })
    } finally {
      setGenerating(false)
    }
  }

  const startQuiz = async (id: string) => {
    const { data } = await quizApi.get(id)
    setActiveQuiz(data)
    setAnswers({})
    startTime.current = Date.now()
    setPhase("taking")
  }

  const submit = async () => {
    if (!activeQuiz) return
    setSubmitting(true)
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000)
    try {
      const { data } = await quizApi.submit(activeQuiz.id, answers, timeTaken)
      setResult(data)
      setPhase("results")
    } catch (err) {
      toast({ variant: "destructive", description: getApiErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  if (phase === "taking" && activeQuiz) {
    const answered = Object.keys(answers).length
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{activeQuiz.title}</h2>
            <p className="text-sm text-muted-foreground">{answered}/{activeQuiz.questions.length} answered</p>
          </div>
          <Button onClick={submit} disabled={submitting || answered === 0}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Submit Quiz
          </Button>
        </div>
        <Progress value={(answered / activeQuiz.questions.length) * 100} />
        <div className="space-y-6">
          {activeQuiz.questions.map((q, i) => (
            <QuizQuestionCard key={q.id} question={q} index={i} answer={answers[q.id]} onAnswer={a => setAnswers(prev => ({ ...prev, [q.id]: a }))} />
          ))}
        </div>
        <Button className="w-full" onClick={submit} disabled={submitting || answered === 0}>Submit</Button>
      </div>
    )
  }

  if (phase === "results" && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="text-center">
          <CardContent className="pt-8 pb-6">
            <Trophy className={`h-12 w-12 mx-auto mb-4 ${result.score >= 70 ? "text-yellow-500" : "text-muted-foreground"}`} />
            <p className="text-4xl font-bold">{result.score}%</p>
            <p className="text-muted-foreground mt-1">{result.correct_count}/{result.total_count} correct</p>
            {result.time_taken_seconds && <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1"><Timer className="h-3 w-3" /> {Math.floor(result.time_taken_seconds / 60)}:{String(result.time_taken_seconds % 60).padStart(2, "0")}</p>}
          </CardContent>
        </Card>
        <div className="space-y-3">
          {result.results.map((r) => (
            <Card key={r.question_id} className={r.is_correct ? "border-success/30" : "border-destructive/30"}>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  {r.is_correct ? <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.question_text}</p>
                    {!r.is_correct && <p className="text-xs text-muted-foreground mt-1">Your answer: {r.user_answer || "—"} · Correct: {r.correct_answer}</p>}
                    <p className="text-xs text-muted-foreground mt-1 italic">{r.explanation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button variant="outline" className="w-full" onClick={() => setPhase("list")}>Back to quizzes</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Quiz Generator</h1>
        <Button onClick={() => setShowGenerate(true)} className="gap-2"><Plus className="h-4 w-4" /> Generate Quiz</Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && [1,2,3].map(i => <Card key={i}><CardContent className="p-5"><div className="space-y-2"><div className="h-4 bg-muted rounded animate-pulse" /><div className="h-4 w-2/3 bg-muted rounded animate-pulse" /></div></CardContent></Card>)}
        {!loading && quizzes.length === 0 && <p className="col-span-full text-center text-muted-foreground text-sm py-12">No quizzes yet. Generate your first one!</p>}
        {quizzes.map(q => (
          <Card key={q.id} className="cursor-pointer hover:ring-2 hover:ring-primary/50" onClick={() => startQuiz(q.id)}>
            <CardContent className="p-5">
              <p className="font-medium truncate">{q.title}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="capitalize text-xs">{q.difficulty}</Badge>
                {q.subject && <Badge variant="secondary" className="text-xs">{q.subject}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate a Quiz</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Source text</Label><Textarea rows={5} value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} placeholder="Paste the content you want to be quizzed on…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={v => setForm(p => ({ ...p, difficulty: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Questions</Label>
                <Input type="number" min={1} max={20} value={form.count} onChange={e => setForm(p => ({ ...p, count: Number(e.target.value) }))} />
              </div>
            </div>
            <Button className="w-full" onClick={generate} disabled={generating || !form.title || !form.text}>
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</> : "Generate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
