// Core domain types mirroring the backend's Pydantic schemas.

export interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  avatar_url: string | null
  theme: "dark" | "light"
  language: string
  preferred_model: string
  is_verified: boolean
  created_at: string
}

export interface Document {
  id: string
  filename: string
  file_type: "pdf" | "docx" | "txt" | "image"
  file_size_bytes: number
  subject: string | null
  status: "pending" | "processing" | "ready" | "failed"
  error_message: string | null
  page_count: number | null
  used_ocr: number
  chunk_count: number
  created_at: string
}

export interface ChatSession {
  id: string
  title: string
  mode: "general" | "pdf_chat" | "exam_mode" | "interview_mode" | "revision_mode"
  model_used: string
  document_id: string | null
  created_at: string
  updated_at: string
}

export interface SourceChunk {
  chunk_id: string
  document_id: string
  page_number: number | null
  snippet: string
  score: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  source_chunks: SourceChunk[] | null
  created_at: string
}

export interface NoteContent {
  summary: string
  detailed_explanation: string
  key_concepts: string[]
  examples: string[]
  common_mistakes: string[]
  revision_tips: string[]
  formula_sheet: string[]
  mermaid_mind_map: string
  interview_questions: string[]
}

export interface Note {
  id: string
  title: string
  subject: string | null
  source_type: "document" | "typed_text" | "chapter"
  content: NoteContent
  created_at: string
  updated_at: string
}

export interface NoteListItem {
  id: string
  title: string
  subject: string | null
  source_type: string
  created_at: string
}

export type QuestionType = "mcq" | "true_false" | "fill_in_blank" | "short_answer" | "coding"
export type Difficulty = "easy" | "medium" | "hard"

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  question_type: QuestionType
  difficulty: Difficulty
  order_index: number
  question_text: string
  options: QuizOption[] | null
}

export interface Quiz {
  id: string
  title: string
  subject: string | null
  difficulty: Difficulty
  question_types: string[]
  created_at: string
  questions: QuizQuestion[]
}

export interface QuizListItem {
  id: string
  title: string
  subject: string | null
  difficulty: Difficulty
  created_at: string
}

export interface QuestionResult {
  question_id: string
  question_text: string
  user_answer: string | null
  correct_answer: string
  is_correct: boolean
  explanation: string
}

export interface QuizAttemptResult {
  id: string
  score: number
  correct_count: number
  total_count: number
  time_taken_seconds: number | null
  completed_at: string
  results: QuestionResult[]
}

export interface Flashcard {
  id: string
  front: string
  back: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string
  last_marked: "easy" | "hard" | null
  times_easy: number
  times_hard: number
}

export interface FlashcardDeck {
  id: string
  title: string
  subject: string | null
  created_at: string
  cards: Flashcard[]
}

export interface FlashcardDeckListItem {
  id: string
  title: string
  subject: string | null
  created_at: string
  card_count: number
  due_count: number
}

export interface StudyPlanItem {
  id: string
  scheduled_date: string
  subject: string
  item_type: "study" | "revision" | "practice_quiz" | "break"
  title: string
  description: string | null
  duration_minutes: number
  is_completed: boolean
  is_revision_reminder: boolean
}

export interface StudyPlan {
  id: string
  title: string
  exam_date: string
  subjects: { name: string; weak: boolean; target_marks: number | null }[]
  daily_study_hours: number
  is_active: boolean
  created_at: string
  items: StudyPlanItem[]
}

export interface StudyPlanListItem {
  id: string
  title: string
  exam_date: string
  is_active: boolean
  days_remaining: number
  progress_percent: number
  created_at: string
}

export interface DailyActivity {
  activity_date: string
  study_minutes: number
  pomodoros_completed: number
  chat_messages_sent: number
  quizzes_taken: number
  flashcards_reviewed: number
  notes_generated: number
  quiz_correct_total: number
  quiz_questions_total: number
  daily_goal_minutes: number
  goal_met: boolean
}

export interface SubjectPerformance {
  subject: string
  accuracy_percent: number
  questions_answered: number
}

export interface AnalyticsSummary {
  study_streak_days: number
  total_study_minutes_30d: number
  total_pomodoros_30d: number
  average_quiz_accuracy: number
  weak_subjects: SubjectPerformance[]
  strong_subjects: SubjectPerformance[]
  daily_activity: DailyActivity[]
}

export interface SearchResultItem {
  type: "document" | "note" | "quiz" | "flashcard_deck" | "chat_session"
  id: string
  title: string
  subject: string | null
  snippet: string
  score: number | null
  created_at: string
}
