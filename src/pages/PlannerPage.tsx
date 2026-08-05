import { useEffect, useState } from "react"
import { CalendarDays, Plus, Loader2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlanChecklistItem } from "@/components/planner/PlanChecklistItem"
import { EmptyState } from "@/components/common/EmptyState"
import { studyPlanApi } from "@/lib/api/study-plan"
import { useToast } from "@/hooks/use-toast"
import { getApiErrorMessage } from "@/lib/api-client"
import type { StudyPlanListItem, StudyPlan, StudyPlanItem } from "@/types"
import { format, parseISO } from "date-fns"

export default function PlannerPage() {
  const [plans, setPlans] = useState<StudyPlanListItem[]>([])
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [subjects, setSubjects] = useState([{ name: "", weak: false }])
  const [form, setForm] = useState({ title: "", exam_date: "", hours: 2 })
  const { toast } = useToast()

  useEffect(() => {
    studyPlanApi.list().then(({ data }) => { setPlans(data); setLoading(false) })
  }, [])

  const loadPlan = async (id: string) => {
    const { data } = await studyPlanApi.get(id)
    setActivePlan(data)
  }

  const create = async () => {
    if (!form.title || !form.exam_date || subjects.every(s => !s.name)) return
    setCreating(true)
    try {
      await studyPlanApi.create({ title: form.title, exam_date: form.exam_date, subjects: subjects.filter(s => s.name), daily_study_hours: form.hours })
      const { data } = await studyPlanApi.list()
      setPlans(data)
      setShowCreate(false)
      toast({ title: "Study plan created!" })
    } catch (err) {
      toast({ variant: "destructive", description: getApiErrorMessage(err) })
    } finally {
      setCreating(false)
    }
  }

  const toggle = async (item: StudyPlanItem) => {
    await studyPlanApi.toggleItem(item.id, !item.is_completed)
    if (activePlan) {
      const { data } = await studyPlanApi.get(activePlan.id)
      setActivePlan(data)
    }
  }

  const today = format(new Date(), "yyyy-MM-dd")
  const todayItems = activePlan?.items.filter(i => i.scheduled_date === today) ?? []
  const groupedItems = activePlan ? Object.entries(
    activePlan.items.reduce((acc, item) => {
      acc[item.scheduled_date] = [...(acc[item.scheduled_date] ?? []), item]
      return acc
    }, {} as Record<string, StudyPlanItem[]>)
  ).slice(0, 14) : []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Study Planner</h1>
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4" /> New Plan</Button>
      </div>

      {/* Plan selector */}
      {plans.length > 0 && !activePlan && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(p => (
            <Card key={p.id} className="cursor-pointer hover:ring-2 hover:ring-primary/50" onClick={() => loadPlan(p.id)}>
              <CardContent className="p-5">
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Exam: {format(parseISO(p.exam_date), "MMM d, yyyy")}</p>
                    <p className="text-xs text-muted-foreground">{p.days_remaining} days remaining</p>
                  </div>
                </div>
                <Progress value={p.progress_percent} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-1">{p.progress_percent}% complete</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activePlan && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setActivePlan(null)}>← All plans</Button>
            <div className="flex-1">
              <h2 className="font-semibold">{activePlan.title}</h2>
              <p className="text-xs text-muted-foreground">Exam: {format(parseISO(activePlan.exam_date), "MMM d, yyyy")}</p>
            </div>
          </div>

          {todayItems.length > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> Today's tasks</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {todayItems.map(item => (
                  <PlanChecklistItem key={item.id} item={item} onToggle={() => toggle(item)} showDuration />
                ))}
              </CardContent>
            </Card>
          )}

          <ScrollArea className="h-[50vh]">
            <div className="space-y-4 pr-3">
              {groupedItems.map(([date, items]) => (
                <div key={date}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{format(parseISO(date), "EEE, MMM d")}</p>
                  <div className="space-y-1.5">
                    {items.map(item => (
                      <PlanChecklistItem key={item.id} item={item} onToggle={() => toggle(item)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {!loading && plans.length === 0 && !activePlan && (
        <EmptyState
          icon={CalendarDays}
          title="No study plans yet"
          description="Create a plan with your exam date to get an intelligent study schedule."
          actionLabel="Create Study Plan"
          onAction={() => setShowCreate(true)}
          className="py-20"
        />
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Study Plan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Exam Date</Label><Input type="date" value={form.exam_date} onChange={e => setForm(p => ({ ...p, exam_date: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Daily study hours</Label><Input type="number" min={0.5} max={16} step={0.5} value={form.hours} onChange={e => setForm(p => ({ ...p, hours: Number(e.target.value) }))} /></div>
            <div className="space-y-2">
              <Label>Subjects</Label>
              {subjects.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input value={s.name} onChange={e => setSubjects(prev => prev.map((x, xi) => xi === i ? { ...x, name: e.target.value } : x))} placeholder="Subject name" />
                  <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                    <input type="checkbox" checked={s.weak} onChange={e => setSubjects(prev => prev.map((x, xi) => xi === i ? { ...x, weak: e.target.checked } : x))} />
                    Weak
                  </label>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setSubjects(p => [...p, { name: "", weak: false }])} className="text-xs">+ Add subject</Button>
            </div>
            <Button className="w-full" onClick={create} disabled={creating || !form.title || !form.exam_date}>
              {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : "Create Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
