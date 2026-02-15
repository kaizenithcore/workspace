"use client"

import * as React from "react"
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { TaskItem } from "@/components/tasks/task-item"
import { EmptyState } from "@/components/ui/empty-state"
import { CheckSquare, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/hooks/use-i18n"
import { cn } from "@/lib/utils"
import type { Task, Category, Project } from "@/lib/types"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"

interface TaskBoardProps {
  tasks: Task[]
  categories?: Category[]
  projects?: Project[]
  onTaskUpdate?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
  onStartPomodoro?: (taskId: string) => void
  className?: string
}

type BoardColumn = {
  id: string
  title: string
  filter: (task: Task) => boolean
}

export function TaskBoard({
  tasks,
  categories = [],
  projects = [],
  onTaskUpdate,
  onTaskDelete,
  onStartPomodoro,
  className,
}: TaskBoardProps) {
  const { t } = useI18n()
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const { cardClassName } = useCardTransparency()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Define columns based on task status/completion
  const columns: BoardColumn[] = [
    {
      id: "todo",
      title: t("todo"),
      filter: (task) => !task.completed && task.priority !== "high",
    },
    {
      id: "high-priority",
      title: t("highPriority"),
      filter: (task) => !task.completed && task.priority === "high",
    },
    {
      id: "in-progress",
      title: t("inProgress"),
      filter: (task) => !task.completed && task.tags?.includes("in-progress"),
    },
    {
      id: "completed",
      title: t("completed"),
      filter: (task) => task.completed,
    },
  ]

  const getColumnTasks = (columnId: string) => {
    const column = columns.find((c) => c.id === columnId)
    if (!column) return []
    return tasks.filter(column.filter)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const taskId = active.id as string
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Determine target column
    const targetColumnId = over.id as string
    
    // Update task based on target column
    if (targetColumnId === "completed") {
      onTaskUpdate?.({ ...task, completed: true })
    } else if (targetColumnId === "high-priority") {
      onTaskUpdate?.({ ...task, completed: false, priority: "high" })
    } else if (targetColumnId === "in-progress") {
      const newTags = task.tags || []
      if (!newTags.includes("in-progress")) {
        onTaskUpdate?.({ ...task, completed: false, tags: [...newTags, "in-progress"] })
      }
    } else if (targetColumnId === "todo") {
      const newTags = (task.tags || []).filter(t => t !== "in-progress")
      onTaskUpdate?.({ ...task, completed: false, tags: newTags, priority: task.priority === "high" ? "medium" : task.priority })
    }
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare className="h-6 w-6 text-muted-foreground" />}
        title={t("noTasks")}
        description={t("noTasksDescription")}
        className={className}
      />
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {columns.map((column) => {
          const columnTasks = getColumnTasks(column.id)
          
          return (
            <SortableContext
              key={column.id}
              id={column.id}
              items={columnTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <Card className={cn("flex flex-col h-[600px]", cardClassName)}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    <span>{column.title}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {columnTasks.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-3 space-y-2">
                  {columnTasks.length === 0 ? (
                    <div
                      className="h-full flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-4"
                    >
                      <p className="text-xs text-muted-foreground text-center">
                        {t("dropTasksHere")}
                      </p>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div key={task.id} className="mb-2">
                        <TaskItem
                          task={task}
                          categories={categories}
                          projects={projects}
                          onUpdate={onTaskUpdate}
                          onDelete={onTaskDelete}
                          onStartPomodoro={onStartPomodoro}
                        />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </SortableContext>
          )
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="opacity-80">
            <TaskItem
              task={activeTask}
              categories={categories}
              projects={projects}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
