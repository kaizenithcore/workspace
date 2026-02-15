"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { CheckSquare, Edit2, Timer } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useGlobalFilters } from "@/lib/hooks/use-global-filters"
import { useDataStore } from "@/lib/hooks/use-data-store"
import { useGlobalPomodoro } from "@/lib/hooks/use-global-pomodoro"
import { useAppSettings } from "@/lib/hooks/use-app-settings"
import type { Task } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer"
import { SessionHistory } from "@/components/pomodoro/session-history"
import { ProBanner } from "@/components/ui/pro-banner"
import { TaskSelectorModal } from "@/components/modals/task-selector-modal"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export default function PomodoroPage() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const taskIdParam = searchParams.get("taskId")
  const { selectedProjectId, selectedCategoryId } = useGlobalFilters()
  const { tasks, categories, projects, pomodoroSessions, updateTask } = useDataStore()
  const globalPomodoro = useGlobalPomodoro()
  const { focusMode, setFocusMode } = useAppSettings()

  const { cardClassName } = useCardTransparency()

  const [taskSelectorOpen, setTaskSelectorOpen] = React.useState(false)
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null)
  const [editingTitle, setEditingTitle] = React.useState("")

  React.useEffect(() => {
    if (taskIdParam) {
      const task = tasks.find((t) => t.id === taskIdParam)
      if (task) globalPomodoro.bindTask(task)
    }
  }, [taskIdParam, tasks, globalPomodoro])

  React.useEffect(() => {
    if (globalPomodoro.pomodorosCompleted > 0 && !focusMode) {
      setFocusMode(true)
    }
  }, [globalPomodoro.pomodorosCompleted, focusMode, setFocusMode])

  const today = new Date()

  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      const projectMatch = !selectedProjectId || task.projectId === selectedProjectId
      const categoryMatch = !selectedCategoryId || (task.categoryIds && task.categoryIds.includes(selectedCategoryId))
      return projectMatch && categoryMatch
    })
  }, [tasks, selectedProjectId, selectedCategoryId])

  const todaysTasks = React.useMemo(() => {
    return filteredTasks.filter((task) => {
      if (!task.dueDate) return false
      return isSameDay(new Date(task.dueDate), today)
    })
  }, [filteredTasks, today])

  const todaySessions = React.useMemo(() => {
    return pomodoroSessions.filter((s) => isSameDay(new Date(s.completedAt), today))
  }, [pomodoroSessions, today])

  const handleSelectTask = (task: Task) => {
    globalPomodoro.bindTask(task)
    setTaskSelectorOpen(false)
  }

  const handleToggleTask = (task: Task) => {
    updateTask(task.id, { completed: !task.completed })
  }

  const handleStartEditTask = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
  }

  const handleSaveEditTask = (taskId: string) => {
    if (editingTitle.trim()) {
      updateTask(taskId, { title: editingTitle.trim() })
    }
    setEditingTaskId(null)
    setEditingTitle("")
  }

  const handleCancelEdit = () => {
    setEditingTaskId(null)
    setEditingTitle("")
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("pomodoro")}</h1>
          <p className="text-muted-foreground">{t("stayFocused")}</p>
        </div>
        {/* <Button
          size="sm"
          variant={focusMode ? "default" : "outline"}
          className="gap-2"
          onClick={() => setFocusMode(!focusMode)}
        >
          {focusMode ? t("focusModeOn") : t("focusModeOff")}
        </Button> */}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className={cn("lg:col-span-2", cardClassName)}>
          <CardContent className="pt-6">
            <PomodoroTimer
              boundTask={globalPomodoro.boundTask ?? undefined}
              categories={categories}
              projects={projects}
              onUnbindTask={() => globalPomodoro.bindTask(null)}
              onBindTask={() => setTaskSelectorOpen(true)}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className={cardClassName}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                {t("todaysTasks")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysTasks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t("noTasksToday")}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-auto">
                  {todaysTasks.map((task) => {
                    const isEditing = editingTaskId === task.id
                    const taskCategory = task.categoryIds?.[0]
                      ? categories.find((c) => c.id === task.categoryIds[0])
                      : null

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border bg-card transition-all group",
                          task.completed && "opacity-60",
                          globalPomodoro.boundTask?.id === task.id && "ring-2 ring-primary",
                        )}
                      >
                        <Checkbox checked={task.completed} onCheckedChange={() => handleToggleTask(task)} />

                        {isEditing ? (
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEditTask(task.id)
                              if (e.key === "Escape") handleCancelEdit()
                            }}
                            onBlur={() => handleSaveEditTask(task.id)}
                            className="flex-1 h-7 text-sm"
                            autoFocus
                          />
                        ) : (
                          <span
                            className={cn(
                              "flex-1 text-sm truncate",
                              task.completed && "line-through text-muted-foreground",
                            )}
                          >
                            {task.title}
                          </span>
                        )}

                        {taskCategory && !isEditing && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: taskCategory.color }}
                          />
                        )}

                        {task.priority === "high" && !isEditing && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0">
                            !
                          </Badge>
                        )}

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isEditing && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleStartEditTask(task)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => globalPomodoro.bindTask(task)}
                              >
                                <Timer className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">{t("todaysSessions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionHistory sessions={todaySessions} categories={categories} projects={projects} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <ProBanner feature={t("detailedFocusAnalytics")} onUpgrade={() => {}} />
      </div>

      <TaskSelectorModal
        open={taskSelectorOpen}
        onOpenChange={setTaskSelectorOpen}
        tasks={filteredTasks.filter((t) => !t.completed)}
        categories={categories}
        projects={projects}
        onSelect={handleSelectTask}
      />
    </div>
  )
}
