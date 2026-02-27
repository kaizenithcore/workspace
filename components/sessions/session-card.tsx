"use client"

import * as React from "react"
import { Clock, CheckSquare, Target, Play, Pause, CheckCircle2, MoreVertical, Edit2, Copy, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/hooks/use-i18n"
import type { Session, Category, Project, Task, Goal } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"

interface SessionCardProps {
  session: Session
  categories?: Category[]
  projects?: Project[]
  tasks?: Task[]
  goals?: Goal[]
  onStart?: () => void
  onPause?: () => void
  onComplete?: () => void
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  className?: string
  hover?: boolean
}

function formatDate(date: Date | undefined): string {
  if (!date) return ""
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(date: Date | undefined): string {
  if (!date) return ""
  return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

export function SessionCard({
  session,
  categories = [],
  projects = [],
  tasks = [],
  goals = [],
  onStart,
  onPause,
  onComplete,
  onEdit,
  onDuplicate,
  onDelete,
  className,
}: SessionCardProps) {
  const { t } = useI18n()
  const { cardClassName } = useCardTransparency()

  const project = session.projectId ? projects.find((p) => p.id === session.projectId) : null
  const category = session.categoryId ? categories.find((c) => c.id === session.categoryId) : null

  // Get linked tasks and goals info
  const linkedTasks = tasks.filter((t) => (session.taskIds || []).includes(t.id))
  const linkedGoals = goals.filter((g) => (session.goalIds || []).includes(g.id))
  const completedTasks = linkedTasks.filter((t) => t.completed).length

  // Calculate progress based on completed tasks or elapsed time
  let progressPercent = 0
  if (linkedTasks.length > 0) {
    progressPercent = (completedTasks / linkedTasks.length) * 100
  } else if (session.status === "active" && session.actualDuration) {
    progressPercent = Math.min((session.actualDuration / session.estimatedDuration) * 100, 100)
  }

  const statusColors: Record<Session["status"], string> = {
    planned: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    active: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    paused:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    completed:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  }

  const statusLabels: Record<Session["status"], string> = {
    planned: t("sessions.status.planned") || "Planned",
    active: t("sessions.status.active") || "Active",
    paused: t("sessions.status.paused") || "Paused",
    completed: t("sessions.status.completed") || "Completed",
  }

  return (
    <Card
      className={cn(
        "border-border/40 bg-card/50 backdrop-blur-sm transition-all",
        hover && "kz-card-hover",
        !hover && "hover:shadow-md hover:scale-[1.01]",
        cardClassName,
        className
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="font-semibold text-sm line-clamp-2">{session.title}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("text-xs", statusColors[session.status])}>
                {statusLabels[session.status]}
              </Badge>
              {project && (
                <Badge variant="secondary" className="text-xs">
                  {project.name}
                </Badge>
              )}
              {category && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                  title={category.name}
                />
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  {t("edit") || "Edit"}
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  {t("duplicate") || "Duplicate"}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("delete") || "Delete"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Scheduled Date and Time */}
        <div className="text-xs text-muted-foreground">
          {formatDate(session.scheduledDate)}
          {session.scheduledStartTime && ` • ${formatTime(session.scheduledStartTime)}`}
        </div>

        {/* Duration Info */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {session.estimatedDuration} {t("sessions.minutes") || "min"}
            </span>
          </div>
          {session.pomodoroEnabled && (
            <div className="text-xs font-medium text-primary">
              🍅 {session.sessionPomodoros} {t("sessions.pomodoros") || "pomodoros"}
            </div>
          )}
        </div>

        {/* Linked Tasks */}
        {linkedTasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <CheckSquare className="h-3.5 w-3.5" />
              {t("sessions.linkedTasks") || "Linked Tasks"} ({completedTasks}/{linkedTasks.length})
            </div>
            <div className="space-y-1">
              {linkedTasks.slice(0, 2).map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-xs">
                  <div
                    className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                      task.completed
                        ? "bg-green-500 border-green-500"
                        : "border-muted-foreground/40 hover:border-primary"
                    )}
                  >
                    {task.completed && <span className="text-[10px] text-white">✓</span>}
                  </div>
                  <span className={cn("line-clamp-1", task.completed && "line-through text-muted-foreground")}>
                    {task.title}
                  </span>
                </div>
              ))}
              {linkedTasks.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{linkedTasks.length - 2} {t("more") || "more"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Linked Goals */}
        {linkedGoals.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              {t("sessions.linkedGoals") || "Objectives"} ({linkedGoals.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {linkedGoals.slice(0, 2).map((goal) => (
                <Badge key={goal.id} variant="secondary" className="text-xs truncate">
                  {goal.title}
                </Badge>
              ))}
              {linkedGoals.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{linkedGoals.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {(linkedTasks.length > 0 || session.status === "active") && (
          <div className="space-y-1">
            <Progress value={progressPercent} className="h-1.5" />
            <div className="text-xs text-muted-foreground text-right">
              {Math.round(progressPercent)}% {session.status === "active" ? "elapsed" : "complete"}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {session.status === "planned" && onStart && (
            <Button
              size="sm"
              className="flex-1"
              onClick={onStart}
              variant="default"
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              {t("sessions.start") || "Start"}
            </Button>
          )}
          {session.status === "active" && onPause && (
            <Button
              size="sm"
              className="flex-1"
              onClick={onPause}
              variant="outline"
            >
              <Pause className="h-3.5 w-3.5 mr-1" />
              {t("sessions.pause") || "Pause"}
            </Button>
          )}
          {session.status === "active" && onComplete && (
            <Button
              size="sm"
              className="flex-1"
              onClick={onComplete}
              variant="default"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              {t("sessions.complete") || "Complete"}
            </Button>
          )}
          {session.status === "paused" && onStart && (
            <Button
              size="sm"
              className="flex-1"
              onClick={onStart}
              variant="default"
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              {t("sessions.resume") || "Resume"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
