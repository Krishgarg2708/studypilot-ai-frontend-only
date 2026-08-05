import { NavLink } from "react-router-dom"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  StickyNote,
  HelpCircle,
  Layers,
  CalendarClock,
  Timer,
  BarChart3,
  Settings,
  Search,
  GraduationCap,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/store/ui-store"
import { Button } from "@/components/ui/button"

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/chat", icon: MessageSquare, label: "AI Chat" },
  { to: "/documents", icon: FileText, label: "PDF Chat" },
  { to: "/notes", icon: StickyNote, label: "Smart Notes" },
  { to: "/quizzes", icon: HelpCircle, label: "Quizzes" },
  { to: "/flashcards", icon: Layers, label: "Flashcards" },
  { to: "/planner", icon: CalendarClock, label: "Study Planner" },
  { to: "/pomodoro", icon: Timer, label: "Pomodoro" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/search", icon: Search, label: "Search" },
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 260 : 76 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="h-screen sticky top-0 shrink-0 p-3 hidden md:block"
    >
      <div className="h-full glass-panel rounded-2xl flex flex-col p-3 shadow-sm">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          {sidebarOpen && (
            <span className="font-semibold tracking-tight text-sm truncate">StudyPilot AI</span>
          )}
        </div>

        <nav className="flex-1 mt-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border/60 pt-2 mt-2 space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )
            }
          >
            <Settings className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </NavLink>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full justify-start gap-3 px-3 text-muted-foreground"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
            {sidebarOpen && <span>Collapse</span>}
          </Button>
        </div>
      </div>
    </motion.aside>
  )
}
