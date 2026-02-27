/**
 * useTaskLimits - Hook for enforcing task feature limits
 */

import { useUserPlan } from "@/hooks/use-user-plan"
import {
  validateSubtaskCount,
  validateDependencyCount,
  validateDescriptionLength,
  type TaskLimitValidation,
} from "@/lib/task-limits"

export interface TaskLimitsHook {
  isPro: boolean
  limits: {
    subtasksPerTask: number
    dependenciesPerTask: number
    descriptionMaxLength: number
  }
  canAddSubtask: (currentCount: number) => TaskLimitValidation
  canAddDependency: (currentCount: number) => TaskLimitValidation
  canSaveDescription: (description: string) => TaskLimitValidation
  getUpsellMessage: (feature: 'subtasks' | 'dependencies' | 'description') => string
}

export function useTaskLimits(): TaskLimitsHook {
  const { plan, isPro, limits } = useUserPlan()

  const canAddSubtask = (currentCount: number) =>
    validateSubtaskCount(currentCount, plan)

  const canAddDependency = (currentCount: number) =>
    validateDependencyCount(currentCount, plan)

  const canSaveDescription = (description: string) =>
    validateDescriptionLength(description, plan)

  const getUpsellMessage = (feature: 'subtasks' | 'dependencies' | 'description') => {
    if (feature === 'subtasks') {
      return `Free plan limited to ${limits.SUBTASKS_PER_TASK} subtasks per task. Upgrade to Pro for unlimited!`
    }
    if (feature === 'dependencies') {
      return limits.DEPENDENCIES_PER_TASK === 0
        ? "Task dependencies are only available in Pro. Upgrade to unlock!"
        : `Free plan limited to ${limits.DEPENDENCIES_PER_TASK} dependency. Upgrade to Pro for unlimited!`
    }
    if (feature === 'description') {
      return `Description limited to ${limits.DESCRIPTION_MAX_LENGTH} characters. Upgrade to Pro for more!`
    }
    return "Upgrade to Pro for unlimited features!"
  }

  return {
    isPro,
    limits: {
      subtasksPerTask: limits.SUBTASKS_PER_TASK,
      dependenciesPerTask: limits.DEPENDENCIES_PER_TASK,
      descriptionMaxLength: limits.DESCRIPTION_MAX_LENGTH,
    },
    canAddSubtask,
    canAddDependency,
    canSaveDescription,
    getUpsellMessage,
  }
}
