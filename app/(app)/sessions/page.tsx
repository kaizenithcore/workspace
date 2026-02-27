"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  Calendar,
  TrendingUp,
  Clock,
} from "lucide-react"
import { PageTransition } from "@/components/ui/page-transition"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useUser } from "@/lib/firebase/hooks"
import { useDataStore } from "@/lib/hooks/use-data-store"
import { useGlobalFilters } from "@/lib/hooks/use-global-filters"
import { useSessions, useUpcomingSessions, useActiveSessions, useCompletedSessions } from "@/lib/hooks/use-sessions"
import { useSessionTemplates } from "@/lib/hooks/use-session-templates"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"
import {
  createSession,
  updateSession,
  deleteSession,
  createSessionFromTemplate,
  getSessionStatistics,
} from "@/lib/firestore-sessions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/ui/segmented-control"
import { SessionCard } from "@/components/sessions/session-card"
import { CreateSessionModal } from "@/components/sessions/create-session-modal"
import { SessionTemplatesTab } from "@/components/sessions/session-templates-tab"
import { SessionHistoryTab } from "@/components/sessions/session-history-tab"
import type { Session } from "@/lib/types"

type ViewType = "upcoming" | "active" | "completed" | "templates" | "history"

export default function SessionsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useI18n()
  const { user } = useUser()
  const { selectedProjectId, selectedCategoryId } = useGlobalFilters()
  const { categories, projects, tasks, goals } = useDataStore()

  // Data hooks
  const { sessions: allSessions } = useSessions()
  const { sessions: upcomingSessions } = useUpcomingSessions()
  const { sessions: activeSessions } = useActiveSessions()
  const { sessions: completedSessions } = useCompletedSessions()
  const { templates } = useSessionTemplates()

  // Provide defaults for potentially undefined values
  const safeGoals = goals || []

  // State
  const [currentView, setCurrentView] = React.useState<ViewType>("upcoming")
  const [search, setSearch] = React.useState("")
  const [filterProjectId, setFilterProjectId] = React.useState<string | null>(null)
  const [filterCategoryId, setFilterCategoryId] = React.useState<string | null>(null)
  const [filterDate, setFilterDate] = React.useState<string>("")
  const [sortBy, setSortBy] = React.useState<"date" | "duration" | "project">("date")
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editingSession, setEditingSession] = React.useState<Session | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const [stats, setStats] = React.useState<any>(null)

  // Load statistics
  React.useEffect(() => {
    if (!user?.uid) return

    const loadStats = async () => {
      try {
        const sessionStats = await getSessionStatistics(user.uid)
        setStats(sessionStats)
      } catch (error) {
        console.error("Failed to load session statistics", error)
      }
    }

    loadStats()
  }, [user?.uid, allSessions.length])

  // Get current view sessions
  const currentSessions = React.useMemo(() => {
    let result: Session[] = []
    switch (currentView) {
      case "upcoming":
        result = upcomingSessions
        break
      case "active":
        result = activeSessions
        break
      case "completed":
        result = completedSessions
        break
      default:
        result = []
    }
    return result
  }, [currentView, upcomingSessions, activeSessions, completedSessions])

  // Filter and sort sessions
  const filteredSessions = React.useMemo(() => {
    let result = currentSessions

    // Apply search
    if (search) {
      result = result.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Apply project filter
    if (filterProjectId) {
      result = result.filter((s) => s.projectId === filterProjectId)
    } else if (selectedProjectId) {
      result = result.filter((s) => s.projectId === selectedProjectId)
    }

    // Apply category filter
    if (filterCategoryId) {
      result = result.filter((s) => s.categoryId === filterCategoryId)
    } else if (selectedCategoryId) {
      result = result.filter((s) => s.categoryId === selectedCategoryId)
    }

    // Apply date filter
    if (filterDate) {
      result = result.filter((s) => {
        const sessionDate = new Date(s.scheduledDate).toISOString().split("T")[0]
        return sessionDate === filterDate
      })
    }

    // Apply sorting
    result = result.sort((a, b) => {
      switch (sortBy) {
        case "duration":
          return b.estimatedDuration - a.estimatedDuration
        case "project":
          return (a.projectId || "").localeCompare(b.projectId || "")
        case "date":
        default:
          return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
      }
    })

    return result
  }, [currentSessions, search, filterProjectId, filterCategoryId, filterDate, sortBy, selectedProjectId, selectedCategoryId])

  // Handle session creation
  const handleCreateSession = async (sessionData: Omit<Session, "id" | "userId" | "createdAt" | "updatedAt" | "ownerId">) => {
    if (!user?.uid) return

    setIsCreating(true)
    try {
      if (editingSession) {
        await updateSession(user.uid, editingSession.id, sessionData)
        toast({
          title: t("success") || "Success",
          description: t("sessions.sessionUpdated") || "Session updated successfully",
        })
      } else {
        await createSession(user.uid, sessionData)
        toast({
          title: t("success") || "Success",
          description: t("sessions.sessionCreated") || "Session created successfully",
        })
      }
      setEditingSession(null)
    } catch (error) {
      console.error("Failed to create/update session", error)
      toast({
        title: t("error") || "Error",
        description: t("sessions.failedToSave") || "Failed to save session",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Handle session start
  const handleStartSession = async (sessionId: string) => {
    if (!user?.uid) return

    try {
      await updateSession(user.uid, sessionId, {
        status: "active",
      })
      toast({
        title: t("success") || "Success",
        description: t("sessions.sessionStarted") || "Session started",
      })
    } catch (error) {
      console.error("Failed to start session", error)
    }
  }

  // Handle session pause
  const handlePauseSession = async (sessionId: string) => {
    if (!user?.uid) return

    try {
      await updateSession(user.uid, sessionId, {
        status: "paused",
      })
      toast({
        title: t("success") || "Success",
        description: t("sessions.sessionPaused") || "Session paused",
      })
    } catch (error) {
      console.error("Failed to pause session", error)
    }
  }

  // Handle session complete
  const handleCompleteSession = async (sessionId: string) => {
    if (!user?.uid) return

    try {
      const session = allSessions.find((s) => s.id === sessionId)
      if (!session) return

      const now = new Date()
      const actualDuration = session.scheduledStartTime
        ? Math.round((now.getTime() - new Date(session.scheduledStartTime).getTime()) / 60000)
        : session.estimatedDuration

      await updateSession(user.uid, sessionId, {
        status: "completed",
        actualDuration,
        completedAt: now,
      })
      toast({
        title: t("success") || "Success",
        description: t("sessions.sessionCompleted") || "Session completed",
      })
    } catch (error) {
      console.error("Failed to complete session", error)
    }
  }

  // Handle session duplicate
  const handleDuplicateSession = async (session: Session) => {
    if (!user?.uid) return

    try {
      const newSession = await createSession(user.uid, {
        title: `${session.title} (Copy)`,
        description: session.description,
        scheduledDate: new Date(),
        scheduledStartTime: null,
        estimatedDuration: session.estimatedDuration,
        status: "planned",
        projectId: session.projectId,
        categoryId: session.categoryId,
        taskIds: session.taskIds,
        goalIds: session.goalIds,
        pomodoroEnabled: session.pomodoroEnabled,
        sessionPomodoros: 0,
      })
      toast({
        title: t("success") || "Success",
        description: t("sessions.sessionDuplicated") || "Session duplicated",
      })
    } catch (error) {
      console.error("Failed to duplicate session", error)
    }
  }

  // Handle session delete
  const handleDeleteSession = async (sessionId: string) => {
    if (!user?.uid) return

    if (!confirm(t("sessions.confirmDelete") || "Are you sure you want to delete this session?")) {
      return
    }

    try {
      await deleteSession(user.uid, sessionId)
      toast({
        title: t("success") || "Success",
        description: t("sessions.sessionDeleted") || "Session deleted",
      })
    } catch (error) {
      console.error("Failed to delete session", error)
    }
  }

  return (
    <PageTransition>
      <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("sessions.title") || "Sessions"}</h1>
        <p className="text-muted-foreground">
          {t("sessions.subtitle") || "Plan and track focused work sessions"}
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/40 p-3">
            <div className="text-xs text-muted-foreground">{t("sessions.completed") || "Completed"}</div>
            <div className="text-2xl font-semibold">{stats.completedSessions}</div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/40 p-3">
            <div className="text-xs text-muted-foreground">{t("sessions.planned") || "Planned"}</div>
            <div className="text-2xl font-semibold">{stats.plannedSessions}</div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/40 p-3">
            <div className="text-xs text-muted-foreground">{t("sessions.avgDuration") || "Avg Duration"}</div>
            <div className="text-2xl font-semibold">{Math.round(stats.avgSessionDuration)}m</div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/40 p-3">
            <div className="text-xs text-muted-foreground">{t("sessions.completionRate") || "Completion"}</div>
            <div className="text-2xl font-semibold">{Math.round(stats.completionRate)}%</div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <SegmentedControl value={currentView} onValueChange={(v) => setCurrentView(v as ViewType)}>
        <SegmentedControlItem value="upcoming" label={t("sessions.upcoming") || "Upcoming"} icon={Calendar} />
        <SegmentedControlItem value="active" label={t("sessions.active") || "Active"} icon={Clock} />
        <SegmentedControlItem value="completed" label={t("sessions.completed") || "Completed"} icon={TrendingUp} />
        <SegmentedControlItem value="templates" label={t("sessions.templates") || "Templates"} icon={LayoutGrid} />
        <SegmentedControlItem value="history" label={t("sessions.history") || "History"} icon={TrendingUp} />
      </SegmentedControl>

      {/* Filters Section (only show for non-template/history views) */}
      {currentView !== "templates" && currentView !== "history" && (
        <div className="space-y-3">
          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search") || "Search sessions..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("sessions.newSession") || "New Session"}
            </Button>
          </div>

          {/* Filter Controls */}
          <div className="flex gap-2 flex-wrap">
            <Select value={filterProjectId || "none"} onValueChange={(v) => setFilterProjectId(v === "none" ? null : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("filterByProject") || "Project"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("all") || "All Projects"}
                </SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategoryId || "none"} onValueChange={(v) => setFilterCategoryId(v === "none" ? null : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("filterByCategory") || "Category"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("all") || "All Categories"}
                </SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-40"
            />

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("sortBy") || "Sort by"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">{t("sessions.sortByDate") || "Date"}</SelectItem>
                <SelectItem value="duration">{t("sessions.sortByDuration") || "Duration"}</SelectItem>
                <SelectItem value="project">{t("sessions.sortByProject") || "Project"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Content View */}
      {currentView === "templates" && (
        <SessionTemplatesTab
          templates={templates}
          categories={categories}
          projects={projects}
          tasks={tasks}
          goals={safeGoals}
          onCreateFromTemplate={async (templateId, overrides) => {
            if (!user?.uid) return
            try {
              await createSessionFromTemplate(user.uid, templateId, overrides)
              toast({
                title: t("success") || "Success",
                description: t("sessions.sessionCreated") || "Session created from template",
              })
            } catch (error) {
              console.error("Failed to create session from template", error)
            }
          }}
          onEditTemplate={(template) => {
            // Implementation for editing templates
          }}
        />
      )}

      {currentView === "history" && (
        <SessionHistoryTab
          completedSessions={completedSessions}
          categories={categories}
          projects={projects}
          tasks={tasks}
          goals={safeGoals}
        />
      )}

      {/* Sessions Grid */}
      {currentView !== "templates" && currentView !== "history" && (
        <div className="space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">{t("sessions.noSessions") || "No sessions found"}</div>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="mt-4"
                variant="default"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("sessions.createFirst") || "Create your first session"}
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  categories={categories}
                  projects={projects}
                  tasks={tasks}
                  goals={goals}
                  onStart={() => handleStartSession(session.id)}
                  onPause={() => handlePauseSession(session.id)}
                  onComplete={() => handleCompleteSession(session.id)}
                  onEdit={() => {
                    setEditingSession(session)
                    setCreateModalOpen(true)
                  }}
                  onDuplicate={() => handleDuplicateSession(session)}
                  onDelete={() => handleDeleteSession(session.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateSessionModal
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open)
          if (!open) {
            setEditingSession(null)
          }
        }}
        session={editingSession}
        categories={categories}
        projects={projects}
        tasks={tasks}
        goals={goals}
        onSave={handleCreateSession}
        loading={isCreating}
      />
      </div>
    </PageTransition>
  )
}
