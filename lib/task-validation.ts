/**
 * Client-side helper for server validation of task limits
 */

import type { Task } from "@/lib/types"

export interface TaskValidationResult {
  valid: boolean
  errors?: string[]
  limits?: {
    subtasks: number
    dependencies: number
    description: number
  }
}

export async function validateTaskLimits(
  userId: string,
  task: Partial<Task>,
  operation: "create" | "update"
): Promise<TaskValidationResult> {
  const response = await fetch("/api/tasks/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, task, operation }),
  })

  const data = (await response.json()) as TaskValidationResult

  if (!response.ok) {
    return data
  }

  return data
}
