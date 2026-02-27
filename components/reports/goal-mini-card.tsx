"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { GoalProgress } from "@/lib/types-reports"
import type { Goal } from "@/lib/types"
import { ChevronRightIcon, AlertTriangleIcon, CheckCircle2Icon } from "lucide-react"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"

interface GoalMiniCardProps {
  goal: Goal
  progress?: GoalProgress
  onClick?: () => void
  className?: string
}

/**
 * Compact goal card for reports view
 */
export function GoalMiniCard({ goal, progress, onClick, className }: GoalMiniCardProps) {
  const percentage = goal.target > 0 ? (goal.current / goal.target) * 100 : 0
  const isOnTrack = progress?.onTrack ?? true
  const willComplete = progress?.projectedDaysRemaining !== null && progress?.projectedDaysRemaining !== undefined

  return (
    <Card
      className={cn(
        "kz-card-hover cursor-pointer",
        !isOnTrack && "border-amber-500/40",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate">{goal.title}</h4>
              {!isOnTrack && (
                <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              )}
              {percentage >= 100 && (
                <CheckCircle2Icon className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              )}
            </div>

            {/* Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {goal.current.toFixed(1)} / {goal.target} {goal.unit}
                </span>
                <span>{percentage.toFixed(0)}%</span>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {progress?.averageRate && (
                <span>
                  {progress.averageRate.toFixed(2)} {goal.unit}/día
                </span>
              )}
              {willComplete && progress?.projectedDaysRemaining && progress.projectedDaysRemaining > 0 && (
                <>
                  <span>·</span>
                  <span
                    className={cn(
                      !isOnTrack && "text-amber-600 dark:text-amber-400 font-medium"
                    )}
                  >
                    ~{Math.ceil(progress.projectedDaysRemaining)} días restantes
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action */}
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface GoalProgressSectionProps {
  goals: Goal[]
  progress: GoalProgress[]
  onGoalClick?: (goal: Goal) => void
  className?: string
}

/**
 * Safely map goals to their progress data
 */
function matchGoalsWithProgress(goals: Goal[], progressList: GoalProgress[]): Array<{ goal: Goal; progress?: GoalProgress }> {
  return goals.map((goal) => {
    // Find matching progress by goalId
    const progress = progressList.find((p) => p.goalId === goal.id)
    return { goal, progress }
  })
}

/**
 * Goal progress section for reports
 */
export function GoalProgressSection({
  goals,
  progress,
  onGoalClick,
  className,
}: GoalProgressSectionProps) {
  if (goals.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No hay objetivos activos en este período.
        </CardContent>
      </Card>
    )
  }

  // Sort: off-track first, then by progress percentage
  const sortedGoals = matchGoalsWithProgress(goals, progress)
    .sort((a, b) => {
      const aOnTrack = a.progress?.onTrack ?? true
      const bOnTrack = b.progress?.onTrack ?? true
      
      if (aOnTrack !== bOnTrack) {
        return aOnTrack ? 1 : -1
      }
      const aPercentage = (a.goal.current / a.goal.target) * 100
      const bPercentage = (b.goal.current / b.goal.target) * 100
      return bPercentage - aPercentage
    })

  const { cardClassName } = useCardTransparency()

  return (
    <div className={cn("space-y-3", className)}>
      {sortedGoals.map(({ goal, progress: prog }) => (
        <GoalMiniCard
          key={goal.id}
          goal={goal}
          progress={prog}
          onClick={() => onGoalClick?.(goal)}
          className={cardClassName}
        />
      ))}
    </div>
  )
}
