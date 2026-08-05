import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { QuizQuestion } from "@/types"

interface QuizQuestionCardProps {
  question: QuizQuestion
  index: number
  answer?: string
  onAnswer: (answer: string) => void
}

/** A single quiz question with its answer input, rendered differently per question
 * type (multiple choice, true/false, or free text for fill-in-blank/short-answer/coding). */
export function QuizQuestionCard({ question, index, answer, onAnswer }: QuizQuestionCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-medium mb-4">
          <span className="text-muted-foreground mr-2">{index + 1}.</span>
          {question.question_text}
        </p>
        {question.question_type === "mcq" && question.options && (
          <div className="space-y-2">
            {question.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onAnswer(opt.id)}
                className={`w-full text-left text-sm rounded-lg border p-3 transition-colors ${
                  answer === opt.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                }`}
              >
                <span className="font-mono mr-2 text-muted-foreground">{opt.id}.</span>
                {opt.text}
              </button>
            ))}
          </div>
        )}
        {question.question_type === "true_false" && (
          <div className="flex gap-2">
            {["true", "false"].map((v) => (
              <button
                key={v}
                onClick={() => onAnswer(v)}
                className={`flex-1 capitalize text-sm rounded-lg border p-2.5 transition-colors ${
                  answer === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
        {["fill_in_blank", "short_answer", "coding"].includes(question.question_type) && (
          <Textarea
            value={answer || ""}
            onChange={(e) => onAnswer(e.target.value)}
            rows={question.question_type === "coding" ? 5 : 2}
            placeholder="Your answer…"
            className="font-mono text-sm"
          />
        )}
      </CardContent>
    </Card>
  )
}
