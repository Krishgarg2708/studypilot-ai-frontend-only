import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { AppLayout } from "@/components/layout/AppLayout"
import { useAuthStore } from "@/store/auth-store"
// Auth pages
import LoginPage from "@/pages/auth/LoginPage"
import SignupPage from "@/pages/auth/SignupPage"

// App pages
import DashboardPage from "@/pages/DashboardPage"
import ChatPage from "@/pages/ChatPage"
import DocumentsPage from "@/pages/DocumentsPage"
import NotesPage from "@/pages/NotesPage"
import QuizPage from "@/pages/QuizPage"
import FlashcardsPage from "@/pages/FlashcardsPage"
import PlannerPage from "@/pages/PlannerPage"
import PomodoroPage from "@/pages/PomodoroPage"
import AnalyticsPage from "@/pages/AnalyticsPage"
import SettingsPage from "@/pages/SettingsPage"
import SearchPage from "@/pages/SearchPage"

function AppInit() {
  const { fetchCurrentUser, user } = useAuthStore()

  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  // Apply persisted theme on startup
  useEffect(() => {
    if (user) {
      document.documentElement.classList.toggle("dark", user.theme === "dark")
    }
  }, [user?.theme])

  // Default to dark mode before user loads
  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider delayDuration={300}>
        <AppInit />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected app routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/quizzes" element={<QuizPage />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/pomodoro" element={<PomodoroPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/search" element={<SearchPage />} />
            </Route>
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster />
      </TooltipProvider>
    </BrowserRouter>
  )
}
