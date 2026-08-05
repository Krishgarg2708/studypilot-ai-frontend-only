import { useState, useEffect } from "react"
import { User, Palette, Bot, Download, Trash2, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"
import { authApi } from "@/lib/api/auth"
import { apiClient, getApiErrorMessage } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore()
  const [models, setModels] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: user?.full_name ?? "", preferred_model: user?.preferred_model ?? "gemma3" })
  const [pwForm, setPwForm] = useState({ current: "", next: "" })
  const [savingPw, setSavingPw] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    apiClient.get<{ available_models: string[] }>("/settings/models").then(({ data }) => setModels(data.available_models)).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await authApi.updateMe({ full_name: form.full_name, preferred_model: form.preferred_model })
      updateUser(data)
      toast({ title: "Profile saved" })
    } catch (err) {
      toast({ variant: "destructive", description: getApiErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const changePw = async () => {
    if (!pwForm.current || !pwForm.next) return
    setSavingPw(true)
    try {
      await authApi.changePassword(pwForm.current, pwForm.next)
      setPwForm({ current: "", next: "" })
      toast({ title: "Password updated" })
    } catch (err) {
      toast({ variant: "destructive", description: getApiErrorMessage(err) })
    } finally {
      setSavingPw(false)
    }
  }

  const exportData = async () => {
    try {
      const { data } = await apiClient.get("/settings/export-data", { responseType: "blob" })
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)]))
      const a = document.createElement("a")
      a.href = url
      a.download = `studypilot_export_${user?.username}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ variant: "destructive", description: "Export failed" })
    }
  }

  const deleteAccount = async () => {
    if (!confirm("Delete your account? This cannot be undone.")) return
    await authApi.deleteAccount()
    logout()
    navigate("/login")
  }

  const toggleTheme = async () => {
    const newTheme = user?.theme === "dark" ? "light" : "dark"
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    updateUser({ theme: newTheme })
    await authApi.updateMe({ theme: newTheme })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Username</Label><Input value={user?.username} disabled className="opacity-60" /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={user?.email} disabled className="opacity-60" /></div>
          <div className="space-y-2"><Label>Full name</Label><Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} /></div>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Save changes
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Current password</Label><Input type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} /></div>
          <div className="space-y-2"><Label>New password</Label><Input type="password" value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} /></div>
          <Button onClick={changePw} disabled={savingPw || !pwForm.current || !pwForm.next} variant="outline">
            {savingPw && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update password
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" /> Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">Switch between dark and light theme.</p>
            </div>
            <Switch checked={user?.theme === "dark"} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      {/* AI Model */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4" /> AI Model</CardTitle>
          <CardDescription>Choose which local Ollama model to use. The model must be pulled first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={form.preferred_model} onValueChange={v => setForm(p => ({ ...p, preferred_model: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["gemma3", "qwen2.5", "phi4", "mistral"].map(m => (
                <SelectItem key={m} value={m}>
                  {m}
                  {models.includes(m) && <Badge variant="success" className="ml-2 text-xs">Pulled</Badge>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {models.length > 0 && <p className="text-xs text-muted-foreground">Pulled models: {models.join(", ")}</p>}
          {models.length === 0 && <p className="text-xs text-muted-foreground">Couldn't reach Ollama. Make sure it's running at localhost:11434.</p>}
          <Button onClick={save} disabled={saving} variant="outline" size="sm">Save model preference</Button>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader><CardTitle className="text-base">Data</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export your data</p>
              <p className="text-xs text-muted-foreground">Download notes, quizzes, flashcards, and plans as JSON.</p>
            </div>
            <Button variant="outline" size="sm" onClick={exportData} className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-destructive">Delete account</p>
              <p className="text-xs text-muted-foreground">Permanently remove all data. This cannot be undone.</p>
            </div>
            <Button variant="destructive" size="sm" onClick={deleteAccount} className="gap-2">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
