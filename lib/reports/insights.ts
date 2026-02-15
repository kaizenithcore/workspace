import type { ReportInsight, ProjectDistribution, GoalProgress, StreakData } from "@/lib/types-reports"

/**
 * Generate automatic insights from report data
 */
export function generateInsights(params: {
  currentStats: {
    totalTimeSeconds: number
    tasksCompleted: number
    pomodorosCompleted: number
  }
  previousStats?: {
    totalTimeSeconds: number
    tasksCompleted: number
    pomodorosCompleted: number
  }
  activePercentage: number
  streak: StreakData
  projectDistribution: ProjectDistribution[]
  goalProgress: GoalProgress[]
}): ReportInsight[] {
  const insights: ReportInsight[] = []

  const { currentStats, previousStats, activePercentage, streak, projectDistribution, goalProgress } = params

  // 1. Consistency insights
  if (activePercentage > 80) {
    insights.push({
      type: "consistency",
      sentiment: "success",
      message: `¡Excelente consistencia! Activo ${Math.round(activePercentage)}% del periodo.`,
    })
  } else if (activePercentage < 40) {
    insights.push({
      type: "consistency",
      sentiment: "warning",
      message: `Baja actividad este periodo (${Math.round(activePercentage)}%). Intenta establecer un objetivo diario.`,
    })
  }

  // 2. Comparison with previous period
  if (previousStats) {
    const timeDelta = previousStats.totalTimeSeconds > 0
      ? ((currentStats.totalTimeSeconds - previousStats.totalTimeSeconds) / previousStats.totalTimeSeconds) * 100
      : 0

    if (Math.abs(timeDelta) > 5) {
      const direction = timeDelta > 0 ? "aumentó" : "disminuyó"
      insights.push({
        type: "comparison",
        sentiment: timeDelta > 0 ? "success" : "info",
        message: `Tu tiempo de trabajo ${direction} un ${Math.abs(timeDelta).toFixed(1)}% comparado con el período anterior.`,
      })
    }

    const tasksDelta = previousStats.tasksCompleted > 0
      ? ((currentStats.tasksCompleted - previousStats.tasksCompleted) / previousStats.tasksCompleted) * 100
      : 0

    if (Math.abs(tasksDelta) > 10) {
      insights.push({
        type: "comparison",
        sentiment: tasksDelta > 0 ? "success" : "info",
        message: `Completaste ${Math.abs(tasksDelta).toFixed(0)}% ${tasksDelta > 0 ? "más" : "menos"} tareas que antes.`,
      })
    }
  }

  // 3. Streak insights
  if (streak.current >= 7) {
    insights.push({
      type: "streak",
      sentiment: "success",
      message: `¡Racha de ${streak.current} días! Mantén el impulso 🔥`,
    })
  } else if (streak.current === 0 && streak.max > 0) {
    insights.push({
      type: "streak",
      sentiment: "warning",
      message: `Se rompió tu racha. Tu récord es ${streak.max} días. ¡Puedes recuperarlo!`,
    })
  }

  // 4. Focus insights (project distribution)
  if (projectDistribution.length > 0) {
    const topProject = projectDistribution[0]
    if (topProject.percentage > 50) {
      insights.push({
        type: "focus",
        sentiment: "success",
        message: `Muy enfocado en "${topProject.projectName}" (${topProject.percentage.toFixed(0)}% de tu tiempo).`,
      })
    } else if (projectDistribution.length > 5 && topProject.percentage < 30) {
      insights.push({
        type: "focus",
        sentiment: "info",
        message: `Trabajas en ${projectDistribution.length} proyectos. Considera priorizar para mayor impacto.`,
      })
    }
  }

  // 5. Goal tracking insights
  const offTrackGoals = goalProgress.filter(g => !g.onTrack)
  if (offTrackGoals.length > 0) {
    const goal = offTrackGoals[0]
    insights.push({
      type: "goal",
      sentiment: "warning",
      message: `"${goal.title}" no va al ritmo esperado. Proyectado: ${goal.projectedDaysRemaining ? Math.ceil(goal.projectedDaysRemaining) : "?"} días restantes.`,
    })
  }

  const completedGoals = goalProgress.filter(g => g.percentage >= 100)
  if (completedGoals.length > 0) {
    insights.push({
      type: "goal",
      sentiment: "success",
      message: `¡Completaste ${completedGoals.length} objetivo${completedGoals.length > 1 ? "s" : ""}! 🎉`,
    })
  }

  // Return max 5 insights
  return insights.slice(0, 5)
}
