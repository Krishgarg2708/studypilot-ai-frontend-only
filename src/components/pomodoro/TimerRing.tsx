import { motion } from "framer-motion"

interface TimerRingProps {
  progress: number // 0-100
  timeLabel: string
  sublabel: string
}

/** The circular SVG progress ring at the center of the Pomodoro timer, animated as time
 * elapses. Extracted so the ring visual can be reused (e.g. a future mini-timer in the
 * sidebar or a "focus mode" overlay) without duplicating the SVG math. */
export function TimerRing({ progress, timeLabel, sublabel }: TimerRingProps) {
  return (
    <div className="relative h-52 w-52">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <motion.circle
          cx="50" cy="50" r="45" fill="none"
          stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          animate={{ strokeDashoffset: 100 - progress }}
          transition={{ duration: 0.5, ease: "linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-4xl font-bold font-mono tabular-nums">{timeLabel}</span>
        <span className="text-xs text-muted-foreground mt-1">{sublabel}</span>
      </div>
    </div>
  )
}
