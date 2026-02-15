"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useUser } from "@/lib/firebase/hooks"
import { useDataStore } from "@/lib/hooks/use-data-store"
import { useGoals, useActiveChallenges } from "@/lib/hooks/use-goals"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"
import { createGoal, updateGoal, deleteGoal, updateChallenge, incrementGoalProgress } from "@/lib/firestore-goals"
import { calculateGoalProgress } from "@/lib/hooks/use-goal-progress"
import { GoalCard } from "@/components/goals/goal-card"
import { StreakPill } from "@/components/goals/streak-pill"
import { ChallengeCard } from "@/components/goals/challenge-card"
import { CreateGoalModal } from "@/components/goals/create-goal-modal"
import type { GoalStatus } from "@/lib/types"

export default function GoalsPage() {
  const { t } = useI18n()
  const { user } = useUser()
  const { goals, loading: goalsLoading } = useGoals()
  const { challenges } = useActiveChallenges()
  const { categories, projects, tasks, timeEntries, pomodoroSessions } = useDataStore()
  const { cardClassName } = useCardTransparency()

  const [filterStatus, setFilterStatus] = React.useState<GoalStatus | "all">("all")
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)

  const filteredGoals = React.useMemo(() => {
    let result = goals

    if (filterStatus !== "all") {
      result = result.filter((g) => g.status === filterStatus)
    }

    // Sort: milestones first, then active by due date, then by creation date
    return result.sort((a, b) => {
      if (a.type === "milestone" && b.type !== "milestone") return -1
      if (a.type !== "milestone" && b.type === "milestone") return 1

      if (a.status === "active" && b.status !== "active") return -1
      if (a.status !== "active" && b.status === "active") return 1

      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1

      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  }, [goals, filterStatus])

  const handleCreateGoal = async (goalData: any) => {
    if (!user?.uid) return

    setCreating(true)
    try {
      await createGoal(user.uid, goalData)
    } catch (error) {
      console.error("Failed to create goal:", error)
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateGoal = async (goalId: string, updates: any) => {
    if (!user?.uid) return

    try {
      await updateGoal(user.uid, goalId, updates)
    } catch (error) {
      console.error("Failed to update goal:", error)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!user?.uid) return

    if (!confirm("Are you sure you want to delete this goal?")) return

    try {
      await deleteGoal(user.uid, goalId)
    } catch (error) {
      console.error("Failed to delete goal:", error)
    }
  }

  const handleTogglePause = async (goal: any) => {
    const newStatus = goal.status === "paused" ? "active" : "paused"
    await handleUpdateGoal(goal.id, { status: newStatus })
  }

  if (goalsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    )
  }

  console.log("Challenges in GoalsPage:", challenges)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("goalsTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("goalsDescription")}</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("createGoal")}
        </Button>
      </div>

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <div className={`mt-4 rounded-xl border bg-card p-6 space-y-4 ${cardClassName}`}>
          <h2 className="font-semibold text-lg">{t("activeChallenges")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onToggleActive={(active) =>
                  user?.uid && updateChallenge(user.uid, challenge.id, { active })
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mt-4">
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allGoals")}</SelectItem>
            <SelectItem value="active">{t("active")}</SelectItem>
            <SelectItem value="paused">{t("pausedGoals")}</SelectItem>
            <SelectItem value="completed">{t("completed")}</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filteredGoals.length} {t("goals")}</Badge>
      </div>

      {/* Goals List */}
      <div className="space-y-4 mt-4">
        {filteredGoals.length === 0 ? (
          <div className={`rounded-lg border bg-card p-8 text-center ${cardClassName}`}>
            <p className="text-muted-foreground">
              {filterStatus === "all"
                ? "No goals yet. Create one to get started!"
                : `No ${filterStatus} goals`}
            </p>
            {filterStatus === "all" && (
              <Button
                variant="link"
                onClick={() => setCreateModalOpen(true)}
                className="mt-2"
              >
                {t("createYourFirstGoal")}
              </Button>
            )}
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const progress = calculateGoalProgress(
              goal,
              tasks,
              timeEntries,
              pomodoroSessions,
              categories,
              projects
            )

            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                categories={categories}
                projects={projects}
                progress={{
                  value: progress.value,
                  percentage: progress.percentage,
                  isCompleted: progress.isCompleted,
                }}
                onEdit={() => {
                  // TODO: Implement edit modal
                }}
                onDelete={() => handleDeleteGoal(goal.id)}
                onTogglePause={() => handleTogglePause(goal)}
                className={cardClassName}
              />
            )
          })
        )}
      </div>

      {/* Create Goal Modal */}
      <CreateGoalModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        categories={categories}
        projects={projects}
        onCreateGoal={handleCreateGoal}
        loading={creating}
      />
    </div>
  )
}
