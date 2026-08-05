import { create } from "zustand"

export type PomodoroPhase = "focus" | "short_break" | "long_break"

interface PomodoroState {
  phase: PomodoroPhase
  isRunning: boolean
  secondsRemaining: number
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  completedFocusSessions: number
  subject: string | null
  startedAt: string | null
  start: () => void
  pause: () => void
  reset: () => void
  tick: () => void
  setDurations: (focus: number, shortBreak: number, longBreak: number) => void
  setSubject: (subject: string | null) => void
  skipToNextPhase: () => void
}

const phaseDuration = (state: PomodoroState, phase: PomodoroPhase) => {
  if (phase === "focus") return state.focusDuration
  if (phase === "short_break") return state.shortBreakDuration
  return state.longBreakDuration
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  phase: "focus",
  isRunning: false,
  secondsRemaining: 25 * 60,
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  completedFocusSessions: 0,
  subject: null,
  startedAt: null,

  start: () => set({ isRunning: true, startedAt: get().startedAt || new Date().toISOString() }),
  pause: () => set({ isRunning: false }),

  reset: () => {
    const state = get()
    set({ isRunning: false, secondsRemaining: phaseDuration(state, state.phase), startedAt: null })
  },

  tick: () => {
    const state = get()
    if (!state.isRunning) return
    if (state.secondsRemaining <= 1) {
      // Phase complete — advance to the next phase automatically.
      get().skipToNextPhase()
      return
    }
    set({ secondsRemaining: state.secondsRemaining - 1 })
  },

  skipToNextPhase: () => {
    const state = get()
    let nextPhase: PomodoroPhase
    let nextCompletedSessions = state.completedFocusSessions

    if (state.phase === "focus") {
      nextCompletedSessions += 1
      // Long break every 4th focus session, short break otherwise (standard Pomodoro cadence).
      nextPhase = nextCompletedSessions % 4 === 0 ? "long_break" : "short_break"
    } else {
      nextPhase = "focus"
    }

    set({
      phase: nextPhase,
      secondsRemaining: phaseDuration({ ...state, phase: nextPhase }, nextPhase),
      isRunning: false,
      completedFocusSessions: nextCompletedSessions,
      startedAt: null,
    })
  },

  setDurations: (focus, shortBreak, longBreak) =>
    set((state) => ({
      focusDuration: focus * 60,
      shortBreakDuration: shortBreak * 60,
      longBreakDuration: longBreak * 60,
      secondsRemaining: state.isRunning ? state.secondsRemaining : phaseDuration({ ...state, phase: state.phase, focusDuration: focus * 60, shortBreakDuration: shortBreak * 60, longBreakDuration: longBreak * 60 }, state.phase),
    })),

  setSubject: (subject) => set({ subject }),
}))
