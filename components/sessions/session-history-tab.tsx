"use client"

import * as React from "react"
import { BarChart3, Calendar, Clock, TrendingUp } from "lucide-react"
import { useI18n } from "@/lib/hooks/use-i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SessionCard } from "@/components/sessions/session-card"
import type { Session, Category, Project, Task, Goal } from "@/lib/types"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"

interface SessionHistoryTabProps {
  completedSessions: Session[]
  categories: Category[]
  projects: Project[]
  tasks: Task[]
  goals: Goal[]
}

function groupSessionsByDate(sessions: Session[]): Record<string, Session[]> {
  const groups: Record<string, Session[]> = {}

  sessions.forEach((session) => {
    const date = new Date(session.completedAt || session.scheduledDate)
    const dateStr = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    if (!groups[dateStr]) {
      groups[dateStr] = []
    }
    groups[dateStr].push(session)
  })

  return groups
}

function groupSessionsByProject(
  sessions: Session[],
  projects: Project[]
): Array<{
  projectId: string | null
  projectName: string
  sessions: Session[]
  totalDuration: number
  completionCount: number
}> {
  const projectMap = new Map<string, Session[]>()

  sessions.forEach((session) => {
    const projectId = session.projectId || "unassigned"
    if (!projectMap.has(projectId)) {
      projectMap.set(projectId, [])
    }
    projectMap.get(projectId)!.push(session)
  })

  return Array.from(projectMap.entries())
    .map(([projectId, sessionList]) => {
      const project =
        projectId !== "unassigned" ? projects.find((p) => p.id === projectId) : null
      return {
        projectId: projectId !== "unassigned" ? projectId : null,
        projectName: project?.name || "Unassigned",
        sessions: sessionList,
        totalDuration: sessionList.reduce((sum, s) => sum + (s.actualDuration || 0), 0),
        completionCount: sessionList.length,
      }
    })
    .sort((a, b) => b.totalDuration - a.totalDuration)
}

export function SessionHistoryTab({
  completedSessions,
  categories,
  projects,
  tasks,
  goals,
}: SessionHistoryTabProps) {
  const { t } = useI18n()
  const { cardClassName } = useCardTransparency()
  const [groupBy, setGroupBy] = React.useState<"date" | "project">("date")

  // Calculate statistics
  const totalSessions = completedSessions.length
  const totalDuration = completedSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0)
  const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0
  const totalPomodoros = completedSessions.reduce((sum, s) => sum + (s.sessionPomodoros || 0), 0)

  // Get project with most sessions
  const projectStats = groupSessionsByProject(completedSessions, projects)
  const topProject = projectStats[0]

  const groupedSessions =
    groupBy === "date"
      ? groupSessionsByDate(completedSessions)
      : groupSessionsByProject(completedSessions, projects).reduce(
          (acc, group) => {
            acc[group.projectName] = group.sessions
            return acc
          },
          {} as Record<string, Session[]>
        )

  if (completedSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <div className="text-muted-foreground">
          {t("sessions.noCompletedSessions") || "No completed sessions yet"}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {t("sessions.historyDescription") || "Start and complete sessions to see your history"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className={`border-border/40 bg-card/50 backdrop-blur-sm ${cardClassName}`}>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">{t("sessions.totalSessions") || "Total"}</div>
            <div className="text-2xl font-semibold">{totalSessions}</div>
          </CardContent>
        </Card>

        <Card className={`border-border/40 bg-card/50 backdrop-blur-sm ${cardClassName}`}>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">{t("sessions.totalDuration") || "Total Time"}</div>
            <div className="text-2xl font-semibold">{Math.round(totalDuration)}m</div>
          </CardContent>
        </Card>

        <Card className={`border-border/40 bg-card/50 backdrop-blur-sm ${cardClassName}`}>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">{t("sessions.avgDuration") || "Average"}</div>
            <div className="text-2xl font-semibold">{avgDuration}m</div>
          </CardContent>
        </Card>

        <Card className={`border-border/40 bg-card/50 backdrop-blur-sm ${cardClassName}`}>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">🍅 {t("sessions.pomodoros") || "Pomodoros"}</div>
            <div className="text-2xl font-semibold">{totalPomodoros}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Project Stats */}
      {topProject && (
        <Card className={`border-border/40 bg-card/50 backdrop-blur-sm ${cardClassName}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("sessions.mostProductiveProject") || "Most Productive Project"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{topProject.projectName}</span>
                <span className="text-sm text-muted-foreground">
                  {topProject.completionCount} {t("sessions.sessions") || "sessions"}
                </span>
              </div>
              <Progress
                value={(topProject.totalDuration / totalDuration) * 100}
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                {topProject.totalDuration} {t("sessions.minutes") || "minutes"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setGroupBy("date")}
          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
            groupBy === "date"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border/40 hover:bg-card/50"
          }`}
        >
          <Calendar className="h-3.5 w-3.5 inline mr-1" />
          {t("sessions.byDate") || "By Date"}
        </button>
        <button
          onClick={() => setGroupBy("project")}
          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
            groupBy === "project"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border/40 hover:bg-card/50"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5 inline mr-1" />
          {t("sessions.byProject") || "By Project"}
        </button>
      </div>

      {/* Grouped Sessions */}
      <div className="space-y-6">
        {Object.entries(groupedSessions).map(([groupLabel, sessionList]) => {
          const groupDuration = sessionList.reduce((sum, s) => sum + (s.actualDuration || 0), 0)

          return (
            <div key={groupLabel} className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <h3 className="font-semibold">{groupLabel}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {groupDuration}m
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {sessionList.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    categories={categories}
                    projects={projects}
                    tasks={tasks}
                    goals={goals}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
