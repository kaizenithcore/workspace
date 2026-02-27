/**
 * useUserPlan - Hook to get current user's plan and Pro status
 */

import { useUserDocument } from "@/lib/hooks/use-user-document"
import { isPro, getLimitsForPlan, type PlanType } from "@/lib/task-limits"

export interface UserPlanInfo {
  plan: PlanType
  isPro: boolean
  loading: boolean
  limits: ReturnType<typeof getLimitsForPlan>
}

export function useUserPlan(): UserPlanInfo {
  const { user, loading } = useUserDocument()

  const plan: PlanType = user?.subscription?.plan || 'free'
  const isProUser = isPro(plan)
  const limits = getLimitsForPlan(plan)

  return {
    plan,
    isPro: isProUser,
    loading,
    limits,
  }
}
