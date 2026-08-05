import { useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { TimerRing } from "@/components/pomodoro/TimerRing"
import { usePomodoroStore } from "@/store/pomodoro-store"
import { analyticsApi } from "@/lib/api/analytics"

const PHASE_LABEL: Record<string, string> = { focus: "Focus", short_break: "Short Break", long_break: "Long Break" }
const PHASE_COLOR: Record<string, string> = {
  focus: "text-primary",
  short_break: "text-emerald-500",
  long_break: "text-blue-500",
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function PomodoroPage() {
  const { phase, isRunning, secondsRemaining, completedFocusSessions, focusDuration,
    shortBreakDuration, longBreakDuration, start, pause, reset, tick, setDurations, skipToNextPhase, startedAt } = usePomodoroStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPhase = useRef(phase)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => tick(), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, tick])

  // Log completed focus sessions to analytics
  useEffect(() => {
    if (phase !== prevPhase.current && prevPhase.current === "focus" && startedAt) {
      const actual = focusDuration - secondsRemaining
      analyticsApi.logPomodoro({
        session_type: "focus", planned_duration_minutes: focusDuration / 60,
        actual_duration_seconds: actual, was_completed: secondsRemaining <= 0,
        started_at: startedAt, ended_at: new Date().toISOString(),
      }).catch(() => {})
    }
    prevPhase.current = phase
  }, [phase])

  const total = phase === "focus" ? focusDuration : phase === "short_break" ? shortBreakDuration : longBreakDuration
  const progress = ((total - secondsRemaining) / total) * 100

  // Update document title while running
  useEffect(() => {
    if (isRunning) document.title = `${formatTime(secondsRemaining)} · ${PHASE_LABEL[phase]} — StudyPilot`
    else document.title = "StudyPilot AI"
    return () => { document.title = "StudyPilot AI" }
  }, [isRunning, secondsRemaining, phase])

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Pomodoro Timer</h1>
        <p className="text-muted-foreground text-sm mt-1">Stay focused, then take a break.</p>
      </div>

      <Card className="glass-panel">
        <CardContent className="pt-8 pb-6 flex flex-col items-center">
          <Badge className={`mb-6 ${PHASE_COLOR[phase]}`}>{PHASE_LABEL[phase]}</Badge>

          {/* Circular progress ring */}
          <div className="mb-6">
            <TimerRing progress={progress} timeLabel={formatTime(secondsRemaining)} sublabel={`${completedFocusSessions} sessions completed`} />
          </div>

          <div className="flex gap-3">
            <Button size="icon" variant="ghost" onClick={reset}><RotateCcw className="h-4 w-4" /></Button>
            <Button size="lg" className="w-32 gap-2" onClick={isRunning ? pause : start}>
              {isRunning ? <><Pause className="h-5 w-5" /> Pause</> : <><Play className="h-5 w-5" /> {secondsRemaining < total ? "Resume" : "Start"}</>}
            </Button>
            <Button size="icon" variant="ghost" onClick={skipToNextPhase}><SkipForward className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Timer Settings (minutes)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Focus", value: focusDuration / 60, key: "focus" },
              { label: "Short Break", value: shortBreakDuration / 60, key: "short" },
              { label: "Long Break", value: longBreakDuration / 60, key: "long" },
            ].map(({ label, value, key }) => (
              <div key={key} className="space-y-2">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number" min={1} max={90}
                  defaultValue={value}
                  onBlur={(e) => {
                    const v = Number(e.target.value)
                    if (v > 0) {
                      const f = key === "focus" ? v : focusDuration / 60
                      const s = key === "short" ? v : shortBreakDuration / 60
                      const l = key === "long" ? v : longBreakDuration / 60
                      setDurations(f, s, l)
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
