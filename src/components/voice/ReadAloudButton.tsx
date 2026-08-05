import { useRef, useState } from "react"
import { Volume2, Square, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { voiceApi } from "@/lib/api/voice"
import { useToast } from "@/hooks/use-toast"

interface ReadAloudButtonProps {
  /** Either supply raw text to speak, or a noteId to use the dedicated
   * "read this note's summary + explanation" backend endpoint. */
  text?: string
  noteId?: string
  label?: string
}

/** Text-to-speech playback button backed by the local Piper TTS service. Used on Smart
 * Notes ("read note aloud") and can be reused anywhere else static text should be read
 * back to the user (flashcard answers, quiz explanations, etc.). */
export function ReadAloudButton({ text, noteId, label = "Read aloud" }: ReadAloudButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle")
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  const play = async () => {
    setState("loading")
    try {
      const blob = noteId ? await voiceApi.readNoteAloud(noteId) : await voiceApi.speak(text ?? "")
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setState("idle"); URL.revokeObjectURL(url) }
      audio.onerror = () => { setState("idle"); URL.revokeObjectURL(url) }
      await audio.play()
      setState("playing")
    } catch {
      toast({ variant: "destructive", title: "Couldn't play audio", description: "Is the local TTS service running?" })
      setState("idle")
    }
  }

  const stop = () => {
    audioRef.current?.pause()
    setState("idle")
  }

  return (
    <Button size="sm" variant="outline" className="gap-1.5" onClick={state === "playing" ? stop : play} disabled={state === "loading"}>
      {state === "loading" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : state === "playing" ? (
        <Square className="h-3.5 w-3.5" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
      {state === "playing" ? "Stop" : label}
    </Button>
  )
}
