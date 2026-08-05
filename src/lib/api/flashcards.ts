import { apiClient } from "@/lib/api-client"
import type { FlashcardDeck, FlashcardDeckListItem, Flashcard } from "@/types"

export const flashcardsApi = {
  generate: (payload: {
    title: string
    subject?: string
    source_type: "document" | "typed_text"
    document_id?: string
    typed_text?: string
    num_cards: number
    model?: string
  }) => apiClient.post<FlashcardDeck>("/flashcards/generate", payload),
  listDecks: (subject?: string) => apiClient.get<FlashcardDeckListItem[]>("/flashcards/decks", { params: { subject } }),
  getDeck: (id: string) => apiClient.get<FlashcardDeck>(`/flashcards/decks/${id}`),
  deleteDeck: (id: string) => apiClient.delete(`/flashcards/decks/${id}`),
  getDue: (deckId?: string) => apiClient.get<Flashcard[]>("/flashcards/due", { params: { deck_id: deckId } }),
  review: (cardId: string, marked: "easy" | "hard") =>
    apiClient.post<Flashcard>(`/flashcards/${cardId}/review`, { marked }),
}
