"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useActiveGoals, useActiveChallenges } from "@/lib/hooks/use-goals"
import { useDataStore } from "@/lib/hooks/use-data-store"
import { useI18n } from "@/lib/hooks/use-i18n"
import { calculateGoalProgress } from "@/lib/hooks/use-goal-progress"
import { calculateStreakInfo } from "@/lib/hooks/use-streak"
import { GoalProgressBar } from "@/components/goals/goal-card"
import { StreakPill } from "@/components/goals/streak-pill"
import { ChallengeCard } from "@/components/goals/challenge-card"

export function DashboardGoalsWidget() {
  const { t } = useI18n()
  const { goals, loading } = useActiveGoals()
  const { challenges } = useActiveChallenges()
  const { categories, projects, tasks, timeEntries, pomodoroSessions } = useDataStore()

  const topGoals = goals.slice(0, 3)

  const streakCount = React.useMemo(() => {
    if (tasks.length === 0) return 0
    const streakInfo = calculateStreakInfo(tasks)
    return streakInfo.current
  }, [tasks])

  if (loading) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Streak */}
      {streakCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("goals.currentStreak")}</span>
          <StreakPill days={streakCount} showLabel={false} />
        </div>
      )}

      {/* Active Challenges Preview */}
      {/* {challenges.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">{t("activeChallenges")}</p>
          {challenges.slice(0, 1).map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} compact />
          ))}
        </div>
      )} */}

      {/* Top Goals Preview */}
      {topGoals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">{t("goals")}</p>
          {topGoals.map((goal) => {
            const progress = calculateGoalProgress(
              goal,
              tasks,
              timeEntries,
              pomodoroSessions,
              categories,
              projects
            )

            const safePercentage = Number.isFinite(progress.percentage) ? progress.percentage : 0
            console.log("Calculated progress for goal", goal.id, ":", {value: progress.value, target: goal.target, percentage: safePercentage, })
            return (
              <div key={goal.id} className="space-y-1.5">
                <p className="text-sm font-medium truncate">{goal.title}</p>
                <GoalProgressBar
                  current={progress.value}
                  target={goal.target}
                  percentage={safePercentage}
                  isCompleted={progress.isCompleted}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* CTA */}
      <Link href="/goals">
        <Button
          variant="outline"
          className="w-full justify-between"
        >
          <span>{t("goals.viewAll")}</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}
