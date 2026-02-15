"use client"

import * as React from "react"
import { Play, Square, Plus, Download, Edit2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useGlobalTimer } from "@/lib/hooks/use-global-timer"
import type { TimeEntry, Category, Project } from "@/lib/types"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"

type GroupBy = "none" | "day" | "project" | "category"

// Helper function to group entries
function groupEntries(
  entries: TimeEntry[],
  groupBy: GroupBy,
  categories: Category[],
  projects: Project[]
): Record<string, TimeEntry[]> {
  if (groupBy === "none") {
    return { all: entries }
  }

  if (groupBy === "day") {
    return entries.reduce(
      (acc, entry) => {
        const dateKey = new Date(entry.startTime).toLocaleDateString()
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(entry)
        return acc
      },
      {} as Record<string, TimeEntry[]>
    )
  }

  if (groupBy === "project") {
    return entries.reduce(
      (acc, entry) => {
        const projectId = entry.projectIds[0]
        const project = projects.find((p) => p.id === projectId)
        const key = project ? project.name : "Without Project"
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(entry)
        return acc
      },
      {} as Record<string, TimeEntry[]>
    )
  }

  if (groupBy === "category") {
    return entries.reduce(
      (acc, entry) => {
        const categoryId = entry.categoryIds[0]
        const category = categories.find((c) => c.id === categoryId)
        const key = category ? category.name : "Without Category"
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(entry)
        return acc
      },
      {} as Record<string, TimeEntry[]>
    )
  }

  return { all: entries }
}

interface TimeTrackerProps {
  entries: TimeEntry[]
  categories?: Category[]
  projects?: Project[]
  globalTimer?: ReturnType<typeof useGlobalTimer>
  onEntryCreate?: (entry: Omit<TimeEntry, "id" | "userId" | "createdAt" | "updatedAt">) => void
  onEntryUpdate?: (entry: TimeEntry) => void
  onEntryDelete?: (entryId: string) => void
  className?: string
}

export function TimeTracker({
  entries,
  categories = [],
  projects = [],
  globalTimer,
  onEntryCreate,
  onEntryUpdate,
  onEntryDelete,
  className,
}: TimeTrackerProps) {
  const { t } = useI18n()
  const [quickAddOpen, setQuickAddOpen] = React.useState(false)
  const [editingEntry, setEditingEntry] = React.useState<TimeEntry | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("")
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("")
  const [description, setDescription] = React.useState("")
  const [groupBy, setGroupBy] = useLocalStorage<GroupBy>("tracker-group-by", "day")
  const { cardClassName } = useCardTransparency()

  // Use global timer if provided, otherwise fallback to local timer (shouldn't happen)
  const isTracking = globalTimer?.isTracking ?? false
  const elapsedTime = globalTimer?.elapsedTime ?? 0

  // Use description from globalTimer when available, otherwise local
  const currentDescription = globalTimer ? globalTimer.description : description

  const startTracking = () => {
    const descToUse = globalTimer ? globalTimer.description : description
    // Normalize "none" to empty string (in case Select uses "none")
    const catId = selectedCategoryId === "none" ? "" : selectedCategoryId
    const projId = selectedProjectId === "none" ? "" : selectedProjectId

    if (globalTimer) {
      globalTimer.startTracking(descToUse, catId, projId)
    } else {
      // fallback behavior if globalTimer not provided
      // you might want to lift this into parent
      console.warn("[TimeTracker] No globalTimer provided; startTracking fallback not implemented")
    }
    // If using local description (no globalTimer), clear local after starting
    if (!globalTimer) {
      setDescription("")
    }
  }

  const stopTracking = () => {
    if (globalTimer) {
      const entry = globalTimer.stopTracking()
      if (entry) {
        onEntryCreate?.({
          description: entry.description || t("untitled"),
          startTime: entry.startTime,
          endTime: entry.endTime,
          duration: entry.duration,
          categoryIds: entry.categoryIds,
          projectIds: entry.projectIds,
        })
      }
    } else {
      console.warn("[TimeTracker] No globalTimer provided; stopTracking fallback not implemented")
    }
  }

  const updateDescription = (value: string) => {
    if (globalTimer) {
      globalTimer.updateDescription(value)
    } else {
      setDescription(value)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getCategory = (categoryId?: string) => categories.find((c) => c.id === categoryId)
  const getProject = (projectId?: string) => projects.find((p) => p.id === projectId)

  const exportToCSV = () => {
    const headers = ["Description", "Category", "Project", "Start Time", "End Time", "Duration (minutes)"]
    const rows = entries.map((entry) => [
      entry.description,
      getCategory(entry.categoryIds[0])?.name || "",
      getProject(entry.projectIds[0])?.name || "",
      new Date(entry.startTime).toISOString(),
      entry.endTime ? new Date(entry.endTime).toISOString() : "",
      Math.round(entry.duration / 60),
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `time-entries-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className={cn("rounded-xl border bg-card p-6", cardClassName)}>
        <div className="flex flex-wrap items-center gap-4">
          <Input
            placeholder={t("whatAreYouWorkingOn")}
            value={currentDescription}
            onChange={(e) => updateDescription(e.target.value)}
            className="flex-1 min-w-[200px]"
            disabled={isTracking}
          />

          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} disabled={isTracking}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("noCategory")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={isTracking}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("project")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("noProject")}</SelectItem>
              {projects.map((proj) => (
                <SelectItem key={proj.id} value={proj.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: proj.color }} />
                    {proj.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className={cn("text-2xl font-mono font-bold min-w-[100px] text-center", isTracking && "text-primary")}>
            {formatDuration(elapsedTime)}
          </div>

          {isTracking ? (
            <Button variant="destructive" size="lg" onClick={stopTracking} className="gap-2">
              <Square className="h-4 w-4" />
              {t("pause")}
            </Button>
          ) : (
            <Button size="lg" onClick={startTracking} className="gap-2">
              <Play className="h-4 w-4" />
              {t("start")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("timeEntries")}</h3>
        <div className="flex items-center gap-2">
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("none")}</SelectItem>
              <SelectItem value="day">{t("day")}</SelectItem>
              <SelectItem value="project">{t("project")}</SelectItem>
              <SelectItem value="category">{t("category")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setQuickAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("addManual")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={entries.length === 0}
            className="gap-2 bg-transparent"
          >
            <Download className="h-4 w-4" />
            {t("exportCSV")}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t("noTimeEntries")}</p>
            <p className="text-sm">{t("startTrackingToSee")}</p>
          </div>
        ) : (
          (() => {
            const grouped = groupEntries(entries, groupBy, categories, projects)
            return Object.entries(grouped).map(([groupLabel, groupedEntries]) => (
              <div key={groupLabel} className="space-y-2">
                {groupBy !== "none" && (
                  <div className="px-2 py-2 text-sm font-semibold text-muted-foreground">
                    {groupLabel}
                  </div>
                )}
                {groupedEntries.map((entry) => {
                  const category = getCategory(entry.categoryIds[0])
                  const project = getProject(entry.projectIds[0])

                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow",
                        cardClassName
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{entry.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {formatTime(entry.startTime)}
                            {entry.endTime && ` - ${formatTime(entry.endTime)}`}
                          </span>
                          {category && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: `${category.color}20`, color: category.color }}
                            >
                              {category.name}
                            </span>
                          )}
                          {project && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: `${project.color}20`, color: project.color }}
                            >
                              {project.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-lg font-mono font-semibold">{formatDuration(entry.duration)}</div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingEntry(entry)}
                          aria-label={t("edit")}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEntryDelete?.(entry.id)}
                          aria-label={t("delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          })()
        )}
      </div>

      <QuickAddEntryModal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        categories={categories}
        projects={projects}
        onSave={(entry) => {
          onEntryCreate?.(entry)
          setQuickAddOpen(false)
        }}
      />

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          open={!!editingEntry}
          onOpenChange={(open) => !open && setEditingEntry(null)}
          categories={categories}
          projects={projects}
          onSave={(updated) => {
            onEntryUpdate?.(updated)
            setEditingEntry(null)
          }}
        />
      )}
    </div>
  )
}


function QuickAddEntryModal({
  open,
  onOpenChange,
  categories,
  projects,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  projects: Project[]
  onSave: (entry: Omit<TimeEntry, "id" | "userId" | "createdAt" | "updatedAt">) => void
}) {
  const { t } = useI18n()
  const [description, setDescription] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [projectId, setProjectId] = React.useState("")
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0])
  const [startTimeStr, setStartTimeStr] = React.useState("09:00")
  const [endTimeStr, setEndTimeStr] = React.useState("10:00")

  const handleSave = () => {
    const startTime = new Date(`${date}T${startTimeStr}`)
    const endTime = new Date(`${date}T${endTimeStr}`)
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

    onSave({
      description: description || t("untitled"),
      startTime,
      endTime,
      duration: Math.max(duration, 0),
      categoryIds: categoryId ? [categoryId] : [],
      projectIds: projectId ? [projectId] : [],
    })

    setDescription("")
    setCategoryId("")
    setProjectId("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addTimeEntry")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="entry-description">{t("description")}</Label>
            <Input
              id="entry-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("whatDidYouWorkOn")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("category")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noCategory")}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("project")}</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectProject")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noProject")}</SelectItem>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: proj.color }} />
                        {proj.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry-date">{t("date")}</Label>
            <Input id="entry-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry-start">{t("startTime")}</Label>
              <Input
                id="entry-start"
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-end">{t("endTime")}</Label>
              <Input id="entry-end" type="time" value={endTimeStr} onChange={(e) => setEndTimeStr(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave}>{t("addEntry")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditEntryModal({
  entry,
  open,
  onOpenChange,
  categories,
  projects,
  onSave,
}: {
  entry: TimeEntry
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  projects: Project[]
  onSave: (entry: TimeEntry) => void
}) {
  const { t } = useI18n()
  const [description, setDescription] = React.useState(entry.description)
  const [categoryId, setCategoryId] = React.useState(entry.categoryIds?.[0] || "")
  const [projectId, setProjectId] = React.useState(entry.projectIds?.[0] || "")
  const [date, setDate] = React.useState(new Date(entry.startTime).toISOString().split("T")[0])
  const [startTimeStr, setStartTimeStr] = React.useState(new Date(entry.startTime).toTimeString().slice(0, 5))
  const [endTimeStr, setEndTimeStr] = React.useState(
    entry.endTime ? new Date(entry.endTime).toTimeString().slice(0, 5) : "",
  )

  const handleSave = () => {
    const startTime = new Date(`${date}T${startTimeStr}`)
    const endTime = endTimeStr ? new Date(`${date}T${endTimeStr}`) : undefined
    const duration = endTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : entry.duration

    onSave({
      ...entry,
      description,
      startTime,
      endTime,
      duration: Math.max(duration, 0),
      categoryIds: categoryId ? [categoryId] : [],
      projectIds: projectId ? [projectId] : [],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editTimeEntry")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-description">{t("description")}</Label>
            <Input id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("category")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noCategory")}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("project")}</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectProject")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noProject")}</SelectItem>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: proj.color }} />
                        {proj.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-date">{t("date")}</Label>
            <Input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start">{t("startTime")}</Label>
              <Input
                id="edit-start"
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end">{t("endTime")}</Label>
              <Input id="edit-end" type="time" value={endTimeStr} onChange={(e) => setEndTimeStr(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave}>{t("saveChanges")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
