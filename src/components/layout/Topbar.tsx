import { useNavigate } from "react-router-dom"
import { Moon, Sun, LogOut, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/auth-store"
import { authApi } from "@/lib/api/auth"

export function Topbar() {
  const { user, logout, updateUser } = useAuthStore()
  const navigate = useNavigate()

  const toggleTheme = async () => {
    const newTheme = user?.theme === "dark" ? "light" : "dark"
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    updateUser({ theme: newTheme })
    await authApi.updateMe({ theme: newTheme })
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const initials = user?.username?.slice(0, 2).toUpperCase() || "??"

  return (
    <header className="sticky top-0 z-30 px-4 md:px-6 pt-3">
      <div className="glass-panel rounded-2xl flex items-center justify-between px-4 py-2.5 shadow-sm">
        <div />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {user?.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-primary/15 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">{user?.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <UserIcon className="h-4 w-4 mr-2" /> Profile & Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
