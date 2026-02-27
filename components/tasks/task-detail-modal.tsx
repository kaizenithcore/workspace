"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {  Save, Loader2, Calendar, Tag, FolderOpen, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { SubtaskList } from "./subtask-list"
import { DependencySelector } from "./dependency-selector"
import { useTaskLimits } from "@/hooks/use-task-limits"
import type { Task, Subtask, Category, Project } from "@/lib/types"

interface TaskDetailModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (task: Partial<Task>) => Promise<void>
  allTasks?: Task[] // For dependency selection
  categories?: Category[]
  projects?: Project[]
}

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
  onSave,
  allTasks = [],
  categories = [],
  projects = [],
}: TaskDetailModalProps) {
  const { canSaveDescription, getUpsellMessage, limits } = useTaskLimits()

  // Form state
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    task?.priority || "medium"
  )
  const [dueDate, setDueDate] = useState(
    task?.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : ""
  )
  const [categoryId, setCategoryId] = useState(task?.categoryIds?.[0] || "")
  const [projectId, setProjectId] = useState(task?.projectId || "")
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || [])
  const [dependencies, setDependencies] = useState<string[]>(
    task?.dependencies || []
  )
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("details")

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setPriority(task.priority || "medium")
      setDueDate(
        task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : ""
      )
      setCategoryId(task.categoryIds?.[0] || "")
      setProjectId(task.projectId || "")
      setSubtasks(task.subtasks || [])
      setDependencies(task.dependencies || [])
      setActiveTab("details")
    }
  }, [task, open])

  // Subtask handlers
  const handleAddSubtask = (subtaskTitle: string) => {
    const newSubtask: Subtask = {
      id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: subtaskTitle,
      completed: false,
      order: subtasks.length,
      createdAt: new Date(),
    }
    setSubtasks([...subtasks, newSubtask])
  }

  const handleToggleSubtask = (subtaskId: string) => {
    setSubtasks(
      subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    )
  }

  const handleDeleteSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== subtaskId))
  }

  // Dependency handlers
  const handleAddDependency = (taskId: string) => {
    if (!dependencies.includes(taskId)) {
      setDependencies([...dependencies, taskId])
    }
  }

  const handleRemoveDependency = (taskId: string) => {
    setDependencies(dependencies.filter((id) => id !== taskId))
  }

  const handleSave = async () => {
    if (!task || !title.trim()) return

    // Validate description length
    const descValidation = canSaveDescription(description)
    if (!descValidation.allowed) {
      alert(getUpsellMessage('description'))
      return
    }

    setIsSaving(true)

    try {
      const updates: Partial<Task> = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        categoryIds: categoryId && categoryId !== "none" ? [categoryId] : [],
        projectId: projectId && projectId !== "none" ? projectId : undefined,
        subtasks,
        dependencies,
        subtaskCount: subtasks.length,
        completedSubtasks: subtasks.filter((st) => st.completed).length,
        // Compute blocked status
        blocked: dependencies.some((depId) => {
          const depTask = allTasks.find((t) => t.id === depId)
          return depTask && !depTask.completed
        }),
      }

      await onSave(updates)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving task:", error)
      alert("Failed to save task. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const isBlocked =
    dependencies.length > 0 &&
    dependencies.some((depId) => {
      const depTask = allTasks.find((t) => t.id === depId)
      return depTask && !depTask.completed
    })

  const descriptionLength = description.length
  const descriptionLimitWarning =
    descriptionLength > limits.descriptionMaxLength * 0.8

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Edit Task</span>
            {isBlocked && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Blocked
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="subtasks">
              Subtasks
              {subtasks.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {subtasks.filter((st) => st.completed).length}/
                  {subtasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="dependencies">
              Dependencies
              {dependencies.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {dependencies.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className="text-lg font-medium"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="task-description" className="flex items-center justify-between">
                <span>Description</span>
                {descriptionLimitWarning && (
                  <span className="text-xs text-muted-foreground">
                    {descriptionLength}/{limits.descriptionMaxLength}
                  </span>
                )}
              </Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a detailed description..."
                className="min-h-[120px] resize-y"
                maxLength={limits.descriptionMaxLength}
              />
              {descriptionLimitWarning && (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Approaching character limit
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="task-priority" className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Priority
                </Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger id="task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="task-due-date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Date
                </Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              {/* Project */}
              <div className="space-y-2">
                <Label htmlFor="task-project" className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Project
                </Label>
                <Select value={projectId || "none"} onValueChange={setProjectId}>
                  <SelectTrigger id="task-project">
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="task-category">Category</Label>
                <Select value={categoryId || "none"} onValueChange={setCategoryId}>
                  <SelectTrigger id="task-category">
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Subtasks Tab */}
          <TabsContent value="subtasks" className="mt-4">
            <SubtaskList
              subtasks={subtasks}
              onAdd={handleAddSubtask}
              onToggle={handleToggleSubtask}
              onDelete={handleDeleteSubtask}
            />
          </TabsContent>

          {/* Dependencies Tab */}
          <TabsContent value="dependencies" className="mt-4">
            <DependencySelector
              taskId={task?.id || ""}
              dependencies={dependencies}
              allTasks={allTasks}
              onAdd={handleAddDependency}
              onRemove={handleRemoveDependency}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
