import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import type { Flashcard } from "@/types"

interface FlipCardProps {
  card: Flashcard
  flipped: boolean
  onFlip: () => void
}

/** A single flashcard in the review session: shows the question, flips to reveal the
 * answer on click/tap. Extracted from FlashcardsPage so the flip interaction and its
 * animation live in one reusable place. */
export function FlipCard({ card, flipped, onFlip }: FlipCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={card.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        onClick={onFlip}
        className="cursor-pointer select-none"
      >
        <Card className="min-h-56 flex items-center justify-center text-center p-8 hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="text-xs text-muted-foreground mb-4">{flipped ? "ANSWER" : "QUESTION"}</div>
            <p className="text-lg font-medium leading-relaxed">{flipped ? card.back : card.front}</p>
            {!flipped && <p className="text-xs text-muted-foreground mt-6">Click to reveal answer</p>}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
