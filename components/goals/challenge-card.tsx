"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { Challenge } from "@/lib/types"
import { useI18n } from "@/lib/hooks/use-i18n"
import { Archive, RotateCcw } from "lucide-react"

interface ChallengeCardProps {
  challenge: Challenge
  onToggleActive?: (active: boolean) => void
  onArchive?: () => void
  onUnarchive?: () => void
  compact?: boolean
  className?: string
}

export function ChallengeCard({
  challenge,
  onToggleActive,
  onArchive,
  onUnarchive,
  compact = false,
  className,
}: ChallengeCardProps) {
  const { t } = useI18n()
  const stateColors: Record<string, string> = {
    active: "border-blue-500/40 bg-blue-500/5",
    paused: "border-muted-foreground/20 bg-muted/40",
    completed: "border-green-500/40 bg-green-500/5",
    failed: "border-red-500/40 bg-red-500/5",
  }

  const stateBadgeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    paused: "secondary",
    completed: "secondary",
    failed: "destructive",
  }

  const titleKeys: Record<string, string> = {
    "7-day-streak": "challenges.7DayStreak.title",
    "5-tasks-week": "challenges.5TasksWeek.title",
    "14-day-streak": "challenges.14DayStreak.title",
    "20-tasks-month": "challenges.20TasksMonth.title",
    "600-min-month": "challenges.600MinMonth.title",
    "10-pomodoros-week": "challenges.10PomodorosWeek.title",
  }

  const descriptionKeys: Record<string, string> = {
    "7-day-streak": "challenges.7DayStreak.description",
    "5-tasks-week": "challenges.5TasksWeek.description",
    "14-day-streak": "challenges.14DayStreak.description",
    "20-tasks-month": "challenges.20TasksMonth.description",
    "600-min-month": "challenges.600MinMonth.description",
    "10-pomodoros-week": "challenges.10PomodorosWeek.description",
  }

  const stateLabels: Record<string, string> = {
    active: t("goals.active"),
    paused: t("goals.paused"),
    completed: t("goals.completed"),
    failed: t("goals.failed"),
  }

  const resolvedTitle = resolveChallengeText(challenge.title, titleKeys[challenge.slug], t)
  const resolvedDescription = resolveChallengeText(
    challenge.description,
    descriptionKeys[challenge.slug],
    t
  )

  const hasProgress = typeof challenge.progress === "number" && typeof challenge.target === "number"
  const progressPercent = hasProgress && (challenge.target ?? 0) > 0
    ? Math.min(Math.round(((challenge.progress ?? 0) / (challenge.target ?? 1)) * 100), 100)
    : 0

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-card",
          stateColors[challenge.state],
          className
        )}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{resolvedTitle}</p>
          {hasProgress && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {challenge.progress} / {challenge.target}
              </p>
              <div className="h-1 w-full rounded-full bg-secondary/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500/80 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
        {onToggleActive && (
          <Switch checked={challenge.active} onCheckedChange={onToggleActive} className="ml-2" />
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 space-y-3",
        stateColors[challenge.state],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">{resolvedTitle}</h3>
          <p className="text-sm text-muted-foreground mt-1">{resolvedDescription}</p>
        </div>
        <Badge variant={stateBadgeVariants[challenge.state]} className="ml-2 flex-shrink-0">
          {stateLabels[challenge.state] || challenge.state}
        </Badge>
      </div>

      {hasProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{t("goals.progress")}</span>
            <span className="font-medium">
              {challenge.progress} / {challenge.target}
            </span>
          </div>
          <div
            className="h-2 w-full rounded-full bg-secondary/50 overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>
      )}

      {(onToggleActive || onArchive || onUnarchive) && (
        <div className="flex items-center justify-between pt-2">
          {onToggleActive && !challenge.archived ? (
            <>
              <span className="text-sm">{t("goals.active")}</span>
              <Switch checked={challenge.active} onCheckedChange={onToggleActive} />
            </>
          ) : (
            <span className="text-sm">
              {challenge.archived ? t("archived") : t("goals.completed")}
            </span>
          )}
          {onArchive && challenge.state === "completed" && !challenge.archived && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onArchive}
              title={t("archive")}
            >
              <Archive className="h-4 w-4" />
            </Button>
          )}
          {onUnarchive && challenge.archived && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onUnarchive}
              title={t("unarchive")}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function resolveChallengeText(
  storedValue: string | undefined,
  fallbackKey: string | undefined,
  t: (key: any) => string
) {
  if (storedValue && storedValue.startsWith("challenges.")) {
    return t(storedValue as any)
  }

  if (fallbackKey) {
    return t(fallbackKey as any)
  }

  return storedValue || ""
}
