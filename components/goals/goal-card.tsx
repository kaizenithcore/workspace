import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Goal, Category, Project } from "@/lib/types"
import { useI18n } from "@/lib/hooks/use-i18n"

interface GoalProgressBarProps {
  current: number
  target: number
  percentage: number
  isCompleted?: boolean
  color?: string
  className?: string
}

export function GoalProgressBar({
  current,
  target,
  percentage,
  isCompleted,
  color = "var(--primary)",
  className,
}: GoalProgressBarProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {current} / {target}
        </span>
        <span className="text-xs text-muted-foreground">{percentage}%</span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-secondary/50 overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isCompleted ? "bg-green-500" : ""
          )}
          style={{
            width: `${percentage}%`,
            backgroundColor: isCompleted ? undefined : color,
          }}
        />
      </div>
    </div>
  )
}

interface GoalCardProps {
  goal: Goal
  categories?: Category[]
  projects?: Project[]
  progress?: {
    value: number
    percentage: number
    isCompleted: boolean
  }
  onEdit?: () => void
  onDelete?: () => void
  onTogglePause?: () => void
  className?: string
}

export function GoalCard({
  goal,
  categories = [],
  projects = [],
  progress = { value: goal.current, percentage: 0, isCompleted: false },
  onEdit,
  onDelete,
  onTogglePause,
  className,
}: GoalCardProps) {
  const { t, language } = useI18n()
  const category = goal.categoryIds?.[0] ? categories.find((c) => c.id === goal.categoryIds?.[0]) : null
  const project = goal.projectIds?.[0] ? projects.find((p) => p.id === goal.projectIds?.[0]) : null

  const typeLabels: Record<string, string> = {
    count: t("goals.countBased"),
    time: t("goals.timeBased"),
    streak: t("goals.streakBased"),
    metric: t("goals.metric"),
    milestone: t("goals.milestone"),
  }

  const unitLabel = (value: Goal["unit"]) => {
    switch (value) {
      case "tasks":
        return t("goals.units.tasks")
      case "pomodoros":
        return t("goals.units.pomodoros")
      case "minutes":
        return t("goals.units.minutes")
      case "hours":
        return t("goals.units.hours")
      case "seconds":
        return t("goals.units.seconds")
      case "days":
        return t("goals.units.days")
      case "percent":
        return t("goals.units.percent")
      default:
        return value
    }
  }

  const formatMessage = (template: string, params: Record<string, string | number>) =>
    Object.entries(params).reduce(
      (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
      template
    )

  const dueDateValue = goal.dueDate
    ? "toDate" in goal.dueDate
      ? goal.dueDate.toDate()
      : new Date(goal.dueDate)
    : null

  const dueDateLabel = dueDateValue
    ? new Intl.DateTimeFormat(language === "es" ? "es-ES" : "en-US").format(dueDateValue)
    : null

  const isPaused = goal.status === "paused"
  const isCompleted = goal.status === "completed"

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 space-y-3 hover:shadow-sm transition-shadow",
        isPaused && "opacity-60",
        isCompleted && "border-green-500/30 bg-green-50/5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{goal.title}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {typeLabels[goal.type] || goal.type}
            </Badge>
            {category && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {category.name}
              </span>
            )}
            {project && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${project.color}20`, color: project.color }}
              >
                {project.name}
              </span>
            )}
            {goal.dueDate && dueDateLabel && (
              <span className="text-[10px] text-muted-foreground">
                {t("goals.due")}: {dueDateLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <GoalProgressBar
        current={progress.value}
        target={goal.target}
        percentage={progress.percentage}
        isCompleted={progress.isCompleted}
        color={category?.color || project?.color}
      />

      <div className="text-xs text-muted-foreground">
        {goal.type === "streak"
          ? formatMessage(t("goals.streakCount"), {
              count: progress.value,
              unit: unitLabel("days"),
            })
          : formatMessage(t("goals.progressCount"), {
              current: progress.value,
              target: goal.target,
              unit: unitLabel(goal.unit),
            })}
      </div>

      <div className="flex items-center gap-1 pt-2">
        {/* {onEdit && (
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8" title={t("goals.edit")}>
            <Edit2 className="h-4 w-4" />
          </Button>
        )} */}
        {onTogglePause && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onTogglePause}
            className="h-8 w-8"
            title={isPaused ? t("goals.resume") : t("goals.pause")}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive"
            title={t("goals.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
