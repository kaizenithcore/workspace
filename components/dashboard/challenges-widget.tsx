"use client"

import * as React from "react"
import { CheckCircle2, ChevronRight, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useChallenges } from "@/lib/hooks/use-goals"
import { useI18n } from "@/lib/hooks/use-i18n"
import { ChallengeCard } from "@/components/goals/challenge-card"
import { updateChallenge } from "@/lib/firestore-goals"
import { useUser } from "@/lib/firebase/hooks"

export function DashboardChallengesWidget() {
  const { t } = useI18n()
  const { user } = useUser()
  const { challenges, loading } = useChallenges()

  const visibleChallenges = challenges.filter((c) => !c.archived)

  if (loading || visibleChallenges.length === 0) {
    return null
  }

  const completedCount = visibleChallenges.filter((c) => c.state === "completed").length
  const sortedChallenges = [...visibleChallenges].sort((a, b) => Number(b.active) - Number(a.active))

  const handleToggle = async (challengeId: string, active: boolean) => {
    if (!user?.uid) return

    const challenge = visibleChallenges.find((c) => c.id === challengeId)
    if (!challenge) return

    const updates: Partial<typeof challenge> = {
      active,
    }

    if (!active) {
      updates.state = "paused"
    } else if (challenge.state === "paused") {
      updates.state = "active"
    }

    const now = new Date()
    const expiresAt = asDate(challenge.expiresAt)
    if (active && challenge.resetPeriod && challenge.resetPeriod !== "none") {
      const bounds = getPeriodBounds(challenge.resetPeriod, now)
      if (!expiresAt || now > expiresAt) {
        updates.progress = 0
        updates.state = "active"
        updates.startedAt = bounds?.start
        updates.expiresAt = bounds?.end
      }
    }

    await updateChallenge(user.uid, challengeId, updates)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {completedCount > 0 && (
          <div className="flex items-center gap-1 text-xs font-medium text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            {t("goals.completedCount").replace("{count}", String(completedCount))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {sortedChallenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            compact
            onToggleActive={(active) => handleToggle(challenge.id, active)}
          />
        ))}
      </div>

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

function getPeriodBounds(period: "weekly" | "monthly" | "none", now: Date) {
  if (period === "none") return null

  if (period === "weekly") {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    end.setMilliseconds(end.getMilliseconds() - 1)

    return { start, end }
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  start.setHours(0, 0, 0, 0)

  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  end.setMilliseconds(end.getMilliseconds() - 1)

  return { start, end }
}

function asDate(value?: Date | null): Date | null {
  if (!value) return null
  if (typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  return new Date(value)
}
