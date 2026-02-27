"use client"

import * as React from "react"
import { Calendar, Plus, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/hooks/use-i18n"
import type { Session, Category, Project, Task, Goal } from "@/lib/types"

interface CreateSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session?: Session | null
  categories?: Category[]
  projects?: Project[]
  tasks?: Task[]
  goals?: Goal[]
  onSave?: (sessionData: Omit<Session, "id" | "userId" | "createdAt" | "updatedAt" | "ownerId">) => Promise<void>
  loading?: boolean
}

export function CreateSessionModal({
  open,
  onOpenChange,
  session,
  categories = [],
  projects = [],
  tasks = [],
  goals = [],
  onSave,
  loading = false,
}: CreateSessionModalProps) {
  const { t } = useI18n()

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [scheduledDate, setScheduledDate] = React.useState("")
  const [scheduledStartTime, setScheduledStartTime] = React.useState("")
  const [estimatedDuration, setEstimatedDuration] = React.useState("60")
  const [projectId, setProjectId] = React.useState<string | null>(null)
  const [categoryId, setCategoryId] = React.useState<string | null>(null)
  const [selectedTasks, setSelectedTasks] = React.useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = React.useState<string[]>([])
  const [pomodoroEnabled, setPomodoroEnabled] = React.useState(false)
  const [showNewTask, setShowNewTask] = React.useState(false)
  const [newTaskTitle, setNewTaskTitle] = React.useState("")
  const [showNewGoal, setShowNewGoal] = React.useState(false)
  const [newGoalTitle, setNewGoalTitle] = React.useState("")

  // Initialize form with existing session data
  React.useEffect(() => {
    if (session) {
      setTitle(session.title)
      setDescription(session.description || "")
      setScheduledDate(session.scheduledDate.toISOString().split("T")[0])
      setScheduledStartTime(
        session.scheduledStartTime 
          ? new Date(session.scheduledStartTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : ""
      )
      setEstimatedDuration(String(session.estimatedDuration))
      setProjectId(session.projectId || null)
      setCategoryId(session.categoryId || null)
      setSelectedTasks(session.taskIds || [])
      setSelectedGoals(session.goalIds || [])
      setPomodoroEnabled(session.pomodoroEnabled)
    } else {
      // Reset for new session
      setTitle("")
      setDescription("")
      setScheduledDate(new Date().toISOString().split("T")[0])
      setScheduledStartTime("")
      setEstimatedDuration("60")
      setProjectId(null)
      setCategoryId(null)
      setSelectedTasks([])
      setSelectedGoals([])
      setPomodoroEnabled(false)
    }
  }, [session, open])

  const handleAddNewTask = () => {
    if (newTaskTitle.trim()) {
      // In a real implementation, this would create the task first
      // For now, we'll just add it to selected and the parent component
      // will handle the actual creation
      setNewTaskTitle("")
      setShowNewTask(false)
    }
  }

  const handleAddNewGoal = () => {
    if (newGoalTitle.trim()) {
      // In a real implementation, this would create the goal first
      setNewGoalTitle("")
      setShowNewGoal(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !scheduledDate) {
      alert(t("sessions.fillRequiredFields") || "Please fill in all required fields")
      return
    }

    const sessionData: Omit<Session, "id" | "userId" | "createdAt" | "updatedAt" | "ownerId"> = {
      title: title.trim(),
      description: description.trim() || null,
      scheduledDate: new Date(`${scheduledDate}T00:00:00`),
      scheduledStartTime: scheduledStartTime
        ? new Date(`${scheduledDate}T${scheduledStartTime}:00`)
        : null,
      estimatedDuration: parseInt(estimatedDuration, 10),
      status: session?.status || "planned",
      projectId: projectId || null,
      categoryId: categoryId || null,
      taskIds: selectedTasks,
      goalIds: selectedGoals,
      pomodoroEnabled,
      sessionPomodoros: session?.sessionPomodoros || 0,
      actualDuration: session?.actualDuration || null,
      completedAt: session?.completedAt || null,
    }

    await onSave?.(sessionData)

    if (!loading) {
      onOpenChange(false)
    }
  }

  const taskOptions = tasks.map((t) => ({
    value: t.id,
    label: t.title,
  }))

  const goalOptions = goals.map((g) => ({
    value: g.id,
    label: g.title,
  }))

  const selectedTaskObjects = tasks.filter((t) => (selectedTasks || []).includes(t.id))
  const selectedGoalObjects = goals.filter((g) => (selectedGoals || []).includes(g.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {session ? t("sessions.editSession") || "Edit Session" : t("sessions.createSession") || "Create Session"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="session-title">
              {t("title")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="session-title"
              placeholder={t("sessions.titlePlaceholder") || "e.g., Design System Update"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="session-description">
              {t("description")} ({t("optional") || "optional"})
            </Label>
            <Textarea
              id="session-description"
              placeholder={t("sessions.descriptionPlaceholder") || "Add notes or details..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="session-date">
                {t("date")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="session-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-time">{t("time")} ({t("optional") || "optional"})</Label>
              <Input
                id="session-time"
                type="time"
                value={scheduledStartTime}
                onChange={(e) => setScheduledStartTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="session-duration">
              {t("sessions.estimatedDuration")} {t("sessions.minutes")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="session-duration"
              type="number"
              placeholder="60"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              min="5"
              max="480"
            />
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label htmlFor="session-project">{t("project")} ({t("optional") || "optional"})</Label>
            <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? null : v)}>
              <SelectTrigger id="session-project">
                <SelectValue placeholder={t("selectProject") || "Select project..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("none") || "None"}
                </SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="session-category">{t("category")} ({t("optional") || "optional"})</Label>
            <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? null : v)}>
              <SelectTrigger id="session-category">
                <SelectValue placeholder={t("selectCategory") || "Select category..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("none") || "None"}
                </SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tasks Section */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>{t("sessions.linkedTasks") || "Linked Tasks"}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewTask(!showNewTask)}
                className="h-7"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t("new") || "New"}
              </Button>
            </div>

            {showNewTask && (
              <div className="flex gap-2">
                <Input
                  placeholder={t("sessions.newTaskTitle") || "Task title..."}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddNewTask()
                  }}
                />
                <Button size="sm" onClick={handleAddNewTask}>
                  {t("add") || "Add"}
                </Button>
              </div>
            )}

            <MultiSelect
              placeholder={t("sessions.selectTasks") || "Select tasks..."}
              options={taskOptions}
              value={selectedTasks}
              onValueChange={setSelectedTasks}
            />

            {selectedTaskObjects.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedTaskObjects.map((task) => (
                  <Badge
                    key={task.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {task.title}
                    <button
                      onClick={() =>
                        setSelectedTasks(selectedTasks.filter((id) => id !== task.id))
                      }
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Goals/Objectives Section */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>{t("sessions.linkedGoals") || "Objectives"}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewGoal(!showNewGoal)}
                className="h-7"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t("new") || "New"}
              </Button>
            </div>

            {showNewGoal && (
              <div className="flex gap-2">
                <Input
                  placeholder={t("sessions.newGoalTitle") || "Objective..."}
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddNewGoal()
                  }}
                />
                <Button size="sm" onClick={handleAddNewGoal}>
                  {t("add") || "Add"}
                </Button>
              </div>
            )}

            <MultiSelect
              placeholder={t("sessions.selectGoals") || "Select objectives..."}
              options={goalOptions}
              value={selectedGoals}
              onValueChange={setSelectedGoals}
            />

            {selectedGoalObjects.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedGoalObjects.map((goal) => (
                  <Badge
                    key={goal.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {goal.title}
                    <button
                      onClick={() =>
                        setSelectedGoals(selectedGoals.filter((id) => id !== goal.id))
                      }
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Pomodoro Toggle */}
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <Label>{t("sessions.pomodoroMode") || "Enable Pomodoro Mode"}</Label>
              <p className="text-xs text-muted-foreground">
                {t("sessions.pomodoroDescription") || "Track pomodoros completed in this session"}
              </p>
            </div>
            <Switch checked={pomodoroEnabled} onCheckedChange={setPomodoroEnabled} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel") || "Cancel"}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (t("saving") || "Saving...") : (session ? t("update") || "Update" : t("create") || "Create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
