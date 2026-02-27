/**
 * Task feature limits for Free vs Pro plans
 * 
 * These limits control feature gating to drive Pro upgrades
 */

export const PLAN_LIMITS = {
  FREE: {
    // Organization limits
    PROJECTS_MAX: 5,
    CATEGORIES_MAX: 5,
    GOALS_ACTIVE_MAX: 2,
    
    // Task limits
    SUBTASKS_PER_TASK: 3,
    DEPENDENCIES_PER_TASK: 0, // Dependencies disabled for free users
    DESCRIPTION_MAX_LENGTH: 2000,
    
    // Feature limits
    SESSION_TEMPLATES_MAX: 1,
    HISTORY_DAYS: 90,
    EXPORT_DAYS: 90,
  },
  PRO: {
    // Organization limits
    PROJECTS_MAX: Infinity,
    CATEGORIES_MAX: Infinity,
    GOALS_ACTIVE_MAX: Infinity,
    
    // Task limits
    SUBTASKS_PER_TASK: Infinity,
    DEPENDENCIES_PER_TASK: Infinity,
    DESCRIPTION_MAX_LENGTH: 10000,
    
    // Feature limits
    SESSION_TEMPLATES_MAX: Infinity,
    HISTORY_DAYS: Infinity,
    EXPORT_DAYS: Infinity,
  },
} as const

// Legacy export for backward compatibility
export const TASK_LIMITS = PLAN_LIMITS

export type PlanType = 'free' | 'individual' | 'trial'

/**
 * Check if a plan is considered "Pro" (has Pro features)
 */
export function isPro(plan: PlanType): boolean {
  return plan === 'individual' || plan === 'trial'
}

/**
 * Get limits for a specific plan
 */
export function getLimitsForPlan(plan: PlanType) {
  return isPro(plan) ? PLAN_LIMITS.PRO : PLAN_LIMITS.FREE
}

/**
 * Validate if a task operation would exceed limits
 */
export interface TaskLimitValidation {
  allowed: boolean
  reason?: string
  limit?: number
  current?: number
}

export function validateSubtaskCount(
  currentCount: number,
  plan: PlanType,
  addingCount: number = 1
): TaskLimitValidation {
  const limits = getLimitsForPlan(plan)
  const newCount = currentCount + addingCount

  if (newCount > limits.SUBTASKS_PER_TASK) {
    return {
      allowed: false,
      reason: 'subtask_limit_reached',
      limit: limits.SUBTASKS_PER_TASK,
      current: currentCount,
    }
  }

  return { allowed: true }
}

export function validateDependencyCount(
  currentCount: number,
  plan: PlanType,
  addingCount: number = 1
): TaskLimitValidation {
  const limits = getLimitsForPlan(plan)
  const newCount = currentCount + addingCount

  if (newCount > limits.DEPENDENCIES_PER_TASK) {
    return {
      allowed: false,
      reason: 'dependency_limit_reached',
      limit: limits.DEPENDENCIES_PER_TASK,
      current: currentCount,
    }
  }

  return { allowed: true }
}

export function validateDescriptionLength(
  description: string,
  plan: PlanType
): TaskLimitValidation {
  const limits = getLimitsForPlan(plan)

  if (description.length > limits.DESCRIPTION_MAX_LENGTH) {
    return {
      allowed: false,
      reason: 'description_too_long',
      limit: limits.DESCRIPTION_MAX_LENGTH,
      current: description.length,
    }
  }

  return { allowed: true }
}

/**
 * Validate organization entity counts (projects, categories, goals)
 */
export function validateProjectCount(
  currentCount: number,
  plan: PlanType
): TaskLimitValidation {
  const limits = getLimitsForPlan(plan)

  if (currentCount >= limits.PROJECTS_MAX) {
    return {
      allowed: false,
      reason: 'project_limit_reached',
      limit: limits.PROJECTS_MAX,
      current: currentCount,
    }
  }

  return { allowed: true }
}

export function validateCategoryCount(
  currentCount: number,
  plan: PlanType
): TaskLimitValidation {
  const limits = getLimitsForPlan(plan)

  if (currentCount >= limits.CATEGORIES_MAX) {
    return {
      allowed: false,
      reason: 'category_limit_reached',
      limit: limits.CATEGORIES_MAX,
      current: currentCount,
    }
  }

  return { allowed: true }
}

export function validateGoalCount(
  currentActiveCount: number,
  plan: PlanType
): TaskLimitValidation {
  const limits = getLimitsForPlan(plan)

  if (currentActiveCount >= limits.GOALS_ACTIVE_MAX) {
    return {
      allowed: false,
      reason: 'goal_limit_reached',
      limit: limits.GOALS_ACTIVE_MAX,
      current: currentActiveCount,
    }
  }

  return { allowed: true }
}
