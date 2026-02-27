/**
 * API Route: /api/tasks/validate
 * 
 * Server-side validation of task limits for Free vs Pro plans
 * Prevents users from bypassing client-side limits
 */

import { NextRequest, NextResponse } from "next/server"
import { getAdminUserDocument, type AdminUserDocument } from "@/lib/firebase-admin"
import { getLimitsForPlan, type PlanType } from "@/lib/task-limits"
import type { Task } from "@/lib/types"

export const runtime = "nodejs"

interface ValidationRequest {
  userId: string
  task: Partial<Task>
  operation: "create" | "update"
}

interface ValidationResponse {
  valid: boolean
  errors?: string[]
  limits?: {
    subtasks: number
    dependencies: number
    description: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidationRequest = await request.json()
    const { userId, task, operation } = body

    if (!userId || !task) {
      return NextResponse.json(
        { valid: false, errors: ["Missing required fields"] },
        { status: 400 }
      )
    }

    // Get user's plan from Firestore using Admin SDK
    const userDoc = (await getAdminUserDocument(userId)) as AdminUserDocument | null
    if (!userDoc) {
      return NextResponse.json(
        { valid: false, errors: ["User not found"] },
        { status: 404 }
      )
    }

    const plan: PlanType = userDoc.subscription?.plan || "free"
    const limits = getLimitsForPlan(plan)
    const errors: string[] = []

    // Validate subtasks count
    if (task.subtasks && task.subtasks.length > limits.SUBTASKS_PER_TASK) {
      errors.push(
        `Subtask limit exceeded. Your plan allows ${limits.SUBTASKS_PER_TASK} subtasks per task.`
      )
    }

    // Validate dependencies count
    if (task.dependencies && task.dependencies.length > limits.DEPENDENCIES_PER_TASK) {
      if (limits.DEPENDENCIES_PER_TASK === 0) {
        errors.push("Task dependencies are not available in your plan.")
      } else {
        errors.push(
          `Dependency limit exceeded. Your plan allows ${limits.DEPENDENCIES_PER_TASK} dependencies per task.`
        )
      }
    }

    // Validate description length
    if (task.description && task.description.length > limits.DESCRIPTION_MAX_LENGTH) {
      errors.push(
        `Description is too long. Maximum ${limits.DESCRIPTION_MAX_LENGTH} characters allowed.`
      )
    }

    const response: ValidationResponse = {
      valid: errors.length === 0,
      limits: {
        subtasks: limits.SUBTASKS_PER_TASK,
        dependencies: limits.DEPENDENCIES_PER_TASK,
        description: limits.DESCRIPTION_MAX_LENGTH,
      },
    }

    if (errors.length > 0) {
      response.errors = errors
    }

    return NextResponse.json(response, {
      status: response.valid ? 200 : 403,
    })
  } catch (error) {
    console.error("[API] Task validation error:", error)
    
    // Provide more specific error messages for common issues
    let errorMessage = "Internal server error"
    if (error instanceof Error) {
      if (error.message.includes("permission-denied")) {
        errorMessage = "Server authentication error - please try again"
      } else if (error.message.includes("not found")) {
        errorMessage = "User not found"
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { valid: false, errors: [errorMessage] },
      { status: 500 }
    )
  }
}

/**
 * Lightweight client helper to call this endpoint
 * Usage:
 * 
 * import { validateTaskLimits } from "@/app/api/tasks/validate/client"
 * 
 * const result = await validateTaskLimits(userId, task, "create")
 * if (!result.valid) {
 *   alert(result.errors.join(", "))
 * }
 */
