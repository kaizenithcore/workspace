"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Plus, LayoutGrid, List, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { TaskList } from "@/components/tasks/task-list"
import { TaskBoard } from "@/components/tasks/task-board"
import { QuickAddModal } from "@/components/modals/quick-add-modal"
import { useToast } from "@/hooks/use-toast"
import { useDataStore } from "@/lib/hooks/use-data-store"
import { useGlobalFilters } from "@/lib/hooks/use-global-filters"
import { useI18n } from "@/lib/hooks/use-i18n"
import type { Task } from "@/lib/types"

type GroupBy = "none" | "category" | "project" | "priority" | "dueDate"

export default function TasksPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useI18n()
  const { selectedProjectId, selectedCategoryId } = useGlobalFilters()
  const { tasks, categories, projects, updateTask, deleteTask, reorderTasks } = useDataStore()

  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<"all" | "active" | "completed" | "archived">("all")
  const [viewMode, setViewMode] = React.useState<"list" | "board">("list")
  const [quickAddOpen, setQuickAddOpen] = React.useState(false)
  const [groupBy, setGroupBy] = React.useState<GroupBy>("none")
  const [isArchiving, setIsArchiving] = React.useState(false)

  const filteredTasks = React.useMemo(() => {
    let result = tasks

    // Filter by archived status
    if (filter === "archived") {
      result = result.filter((task) => task.archived)
    } else {
      result = result.filter((task) => !task.archived)
    }

    if (selectedProjectId) {
      result = result.filter((task) => task.projectId === selectedProjectId)
    }

    if (selectedCategoryId) {
      result = result.filter((task) => task.categoryIds && task.categoryIds.includes(selectedCategoryId))
    }

    if (search) {
      result = result.filter((task) => task.title.toLowerCase().includes(search.toLowerCase()))
    }

    if (filter === "active") {
      result = result.filter((task) => !task.completed)
    } else if (filter === "completed") {
      result = result.filter((task) => task.completed)
    }

    // Sort: incomplete first, then completed
    return result.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      return a.order - b.order
    })
  }, [tasks, search, filter, selectedProjectId, selectedCategoryId])

  const groupedTasks = React.useMemo(() => {
    if (groupBy === "none") {
      return { [t("allTasks")]: filteredTasks }
    }

    const groups: Record<string, Task[]> = {}

    filteredTasks.forEach((task) => {
      let key: string

      switch (groupBy) {
        case "category":
          if (task.categoryIds && task.categoryIds.length > 0) {
            const category = categories.find((c) => c.id === task.categoryIds[0])
            key = category?.name || t("noCategory")
          } else {
            key = t("noCategory")
          }
          break
        case "project":
          if (task.projectId) {
            const project = projects.find((p) => p.id === task.projectId)
            key = project?.name || t("noProject")
          } else {
            key = t("noProject")
          }
          break
        case "priority":
          key = task.priority === "high" ? t("high") : task.priority === "medium" ? t("medium") : task.priority === "low" ? t("low") : t("noPriority")
          break
        case "dueDate":
          if (task.dueDate) {
            const date = new Date(task.dueDate)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            const nextWeek = new Date(today)
            nextWeek.setDate(nextWeek.getDate() + 7)

            if (date < today) {
              key = t("overdue")
            } else if (date < tomorrow) {
              key = t("today")
            } else if (date < nextWeek) {
              key = t("thisWeekLabel")
            } else {
              key = t("later")
            }
          } else {
            key = t("noDueDate")
          }
          break
        default:
          key = t("allTasks")
      }

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(task)
    })

    return groups
  }, [filteredTasks, groupBy, categories, projects, t])

  const getGroupColor = (groupName: string) => {
    if (groupBy === "category") {
      const category = categories.find((c) => c.name === groupName)
      return category?.color
    }
    if (groupBy === "project") {
      const project = projects.find((p) => p.name === groupName)
      return project?.color
    }
    if (groupBy === "priority") {
      if (groupName === "High") return "#EF4444"
      if (groupName === "Medium") return "#F59E0B"
      if (groupName === "Low") return "#10B981"
    }
    return undefined
  }

  const handleTaskUpdate = async (updatedTask: Task) => {
    await updateTask(updatedTask.id, updatedTask)
    
    // If completion status changed, reorder tasks automatically
    const originalTask = tasks.find((t) => t.id === updatedTask.id)
    if (originalTask && originalTask.completed !== updatedTask.completed) {
      // Let the filteredTasks useMemo handle the sorting automatically
      // It already sorts by completion status
    }
  }

  const handleTaskDelete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    deleteTask(taskId)

    toast({
      title: t("taskDeleted"),
      description: task?.title,
    })
  }

  const handleTaskReorder = (taskId: string, newIndex: number) => {
    reorderTasks(taskId, newIndex)
  }

  const handleStartPomodoro = (taskId: string) => {
    router.push(`/pomodoro?taskId=${taskId}`)
  }

  const handleArchiveCompleted = async () => {
    setIsArchiving(true)
    try {
      const completedTasks = tasks.filter((t) => t.completed && !t.archived)
      await Promise.all(completedTasks.map((task) => updateTask(task.id, { archived: true })))
      toast({
        title: t("tasksArchived"),
        description: `${completedTasks.length} ${t("tasksArchivedDescription")}`,
      })
    } catch (error) {
      toast({
        title: t("error"),
        description: t("errorArchivingTasks"),
        variant: "destructive",
      })
    } finally {
      setIsArchiving(false)
    }
  }

  const taskCount = filteredTasks.length
  const completedCount = filteredTasks.filter((t) => t.completed).length

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("tasks")}</h1>
          <p className="text-muted-foreground">{t("manageTasksDescription")}</p>
        </div>
        <div className="ms-5 mt-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-medium">
          <div className="text-2xl font-bold">Total: {taskCount}</div>
          <div className="text-xs text-muted-foreground">
            {completedCount} {t("completed")}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchTasks")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                {filter === "all" ? t("all") : filter === "active" ? t("active") : t("completed")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{t("filterByStatus")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilter("all")}>{t("all")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("active")}>{t("active")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("completed")}>{t("completed")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("archived")}>{t("archived")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Layers className="h-4 w-4" />
                {t("group")}: {groupBy === "none" ? t("none") : groupBy === "category" ? t("category") : groupBy === "project" ? t("project") : groupBy === "priority" ? t("filter") : t("date")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{t("groupBy")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={groupBy === "none"} onCheckedChange={() => setGroupBy("none")}>
                {t("none")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={groupBy === "category"} onCheckedChange={() => setGroupBy("category")}>
                {t("category")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={groupBy === "project"} onCheckedChange={() => setGroupBy("project")}>
                {t("project")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={groupBy === "priority"} onCheckedChange={() => setGroupBy("priority")}>
                {t("filter")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={groupBy === "dueDate"} onCheckedChange={() => setGroupBy("dueDate")}>
                {t("date")}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-md border p-0.5">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "board" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode("board")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {filter !== "archived" && completedCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={handleArchiveCompleted}
              disabled={isArchiving}
            >
              {isArchiving ? t("archiving") : t("archiveCompleted")}
            </Button>
          )}

          <Button size="sm" className="gap-2" onClick={() => setQuickAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("addTask")}
          </Button>
        </div>
      </div>
      

      {viewMode === "board" ? (
        <TaskBoard
          tasks={filteredTasks}
          categories={categories}
          projects={projects}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
          onStartPomodoro={handleStartPomodoro}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
            <div key={groupName}>
              {groupBy !== "none" && (
                <div className="flex items-center gap-2 mb-3">
                  {getGroupColor(groupName) && (
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: getGroupColor(groupName) }} />
                  )}
                  <h3 className="font-medium text-sm">{groupName}</h3>
                  <span className="text-xs text-muted-foreground">({groupTasks.length})</span>
                </div>
              )}
              <TaskList
                tasks={groupTasks}
                categories={categories}
                projects={projects}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
                onTaskReorder={handleTaskReorder}
                onStartPomodoro={handleStartPomodoro}
                className="space-y-2"
              />
            </div>
          ))}
        </div>
      )}

      <QuickAddModal projectId={selectedProjectId || undefined} categories={categories} projects={projects} defaultType="task" open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  )
}
