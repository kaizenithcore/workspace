"use client"
import { Timer, Coffee } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/hooks/use-i18n"
import type { PomodoroSession, Category, Project } from "@/lib/types"

interface SessionHistoryProps {
  sessions: PomodoroSession[]
  categories?: Category[]
  projects?: Project[]
  className?: string
}

export function SessionHistory({ sessions, categories = [], projects = [], className }: SessionHistoryProps) {
  const { t } = useI18n()

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getCategory = (categoryId?: string) => categories.find((c) => c.id === categoryId)
  const getProject = (projectId?: string) => projects.find((p) => p.id === projectId)

  if (sessions.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <Timer className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{t("noSessionsYet")}</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {sessions.map((session) => {
        const category = getCategory(session.categoryIds?.[0])
        const project = getProject(session.projectIds?.[0])

        return (
          <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0",
                session.type === "pomodoro" ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-500",
              )}
            >
              {session.type === "pomodoro" ? <Timer className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">
                {session.type === "pomodoro"
                  ? t("focusSession")
                  : session.type === "short_break"
                    ? t("shortBreak")
                    : t("longBreak")}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-muted-foreground">{formatTime(session.completedAt)}</span>
                {category && (
                  <span
                    className="text-[9px] px-1 py-0.5 rounded"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    {category.name}
                  </span>
                )}
                {project && (
                  <span
                    className="text-[9px] px-1 py-0.5 rounded"
                    style={{ backgroundColor: `${project.color}20`, color: project.color }}
                  >
                    {project.name}
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground flex-shrink-0">{formatDuration(session.duration)}</div>
          </div>
        )
      })}
    </div>
  )
}
