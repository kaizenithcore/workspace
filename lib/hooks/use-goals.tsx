"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/lib/firebase/hooks"
import { subscribeToUserGoals, subscribeToUserChallenges } from "@/lib/firestore-goals"
import type { Goal, Challenge } from "@/lib/types"

export function useGoals() {
  const { user } = useUser()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user?.uid) {
      setGoals([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToUserGoals(user.uid, (goals) => {
      setGoals(goals)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])

  return { goals, loading, error }
}

export function useChallenges() {
  const { user } = useUser()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user?.uid) {
      setChallenges([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToUserChallenges(user.uid, (challenges) => {
      setChallenges(challenges)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])

  return { challenges, loading, error }
}

export function useGoalsByStatus(status: "active" | "paused" | "completed" | "failed") {
  const { goals, loading } = useGoals()
  return {
    goals: goals.filter((g) => g.status === status),
    loading,
  }
}

export function useActiveGoals() {
  const { goals, loading } = useGoals()
  return {
    goals: goals.filter((g) => g.status === "active").sort((a, b) => {
      // Sort by due date ascending, then by creation date
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return b.createdAt.getTime() - a.createdAt.getTime()
    }),
    loading,
  }
}

export function useActiveChallenges() {
  const { challenges, loading } = useChallenges()
  console.log("All challenges from useActiveChallenges:", challenges)
  return {
    challenges: challenges.filter((c) => c.active),
    loading,
  }
}
