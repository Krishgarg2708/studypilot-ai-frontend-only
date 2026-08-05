import { useRef, useState } from "react"
import { Mic, Square, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { voiceApi } from "@/lib/api/voice"
import { useToast } from "@/hooks/use-toast"
import { getApiErrorMessage } from "@/lib/api-client"

interface VoiceRecorderButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

type RecordState = "idle" | "recording" | "transcribing"

/** Microphone button: records audio in the browser via MediaRecorder, then sends it to
 * the local Faster-Whisper backend for speech-to-text. Used as the voice-input control
 * in AI Chat and PDF Chat next to the message box. */
export function VoiceRecorderButton({ onTranscript, disabled }: VoiceRecorderButtonProps) {
  const [state, setState] = useState<RecordState>("idle")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const { toast } = useToast()

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setState("transcribing")
        try {
          const { data } = await voiceApi.transcribe(blob)
          if (data.text.trim()) {
            onTranscript(data.text.trim())
          } else {
            toast({ description: "Didn't catch that — try speaking a bit longer." })
          }
        } catch (err) {
          toast({ variant: "destructive", title: "Transcription failed", description: getApiErrorMessage(err) })
        } finally {
          setState("idle")
        }
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setState("recording")
    } catch {
      toast({ variant: "destructive", title: "Microphone unavailable", description: "Please allow microphone access to use voice input." })
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
  }

  return (
    <Button
      type="button"
      size="icon"
      variant={state === "recording" ? "destructive" : "outline"}
      className="shrink-0 h-10 w-10"
      disabled={disabled || state === "transcribing"}
      onClick={state === "recording" ? stopRecording : startRecording}
      title={state === "recording" ? "Stop recording" : "Speak your question"}
    >
      {state === "transcribing" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === "recording" ? (
        <Square className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  )
}
