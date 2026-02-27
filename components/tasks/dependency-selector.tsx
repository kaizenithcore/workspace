"use client"

import React, { useState, useMemo } from "react"
import { Search, X, AlertCircle, Sparkles, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useTaskLimits } from "@/hooks/use-task-limits"
import type { Task } from "@/lib/types"

interface DependencySelectorProps {
  taskId: string // Current task ID (to prevent circular dependencies)
  dependencies: string[] // Array of task IDs this task depends on
  allTasks: Task[] // All available tasks to choose from
  onAdd?: (taskId: string) => void
  onRemove?: (taskId: string) => void
  readonly?: boolean
}

export function DependencySelector({
  taskId,
  dependencies = [],
  allTasks = [],
  onAdd,
  onRemove,
  readonly = false,
}: DependencySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const { canAddDependency, getUpsellMessage, isPro, limits } = useTaskLimits()

  // Filter out current task, completed tasks, archived tasks, and already-selected dependencies
  const availableTasks = useMemo(() => {
    return allTasks.filter((task) => {
      if (task.id === taskId) return false // Can't depend on self
      if (task.completed) return false // Don't show completed tasks
      if (task.archived) return false // Don't show archived tasks
      if (dependencies.includes(task.id)) return false // Don't show already-added dependencies
      // TODO: Check for circular dependencies (if task A depends on us, we can't depend on A)
      return true
    })
  }, [allTasks, taskId, dependencies])

  // Search filter
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return availableTasks
    const query = searchQuery.toLowerCase()
    return availableTasks.filter((task) =>
      task.title.toLowerCase().includes(query)
    )
  }, [availableTasks, searchQuery])

  // Get dependency task objects
  const dependencyTasks = dependencies
    .map((depId) => allTasks.find((t) => t.id === depId))
    .filter(Boolean) as Task[]

  // Check how many dependencies are unresolved (not completed)
  const unresolvedCount = dependencyTasks.filter((t) => !t.completed).length
  const isBlocked = unresolvedCount > 0

  const canAddMore = canAddDependency(dependencies.length).allowed
  const showLimitWarning =
    dependencies.length >= limits.dependenciesPerTask && !isPro
  const dependenciesDisabled = limits.dependenciesPerTask === 0

  const handleAddDependency = (depTaskId: string) => {
    const validation = canAddDependency(dependencies.length)
    if (!validation.allowed) {
      alert(getUpsellMessage('dependencies'))
      return
    }

    onAdd?.(depTaskId)
    setSearchQuery("")
    setIsSearching(false)
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Dependencies</span>
          {isBlocked && (
            <Badge variant="destructive" className="text-xs">
              <Lock className="w-3 h-3 mr-1" />
              Blocked ({unresolvedCount})
            </Badge>
          )}
          {!isPro && !dependenciesDisabled && (
            <span className="text-xs text-muted-foreground">
              ({dependencies.length}/{limits.dependenciesPerTask} used)
            </span>
          )}
        </div>
        {!readonly && !dependenciesDisabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearching(true)}
            disabled={!canAddMore}
            className="h-7 text-xs"
          >
            <Search className="w-3 h-3 mr-1" />
            Add Dependency
          </Button>
        )}
      </div>

      {/* Feature disabled for free users */}
      {dependenciesDisabled && (
        <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-md">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs space-y-1">
            <p className="font-medium text-purple-900 dark:text-purple-100">
              Task Dependencies (Pro Feature)
            </p>
            <p className="text-purple-700 dark:text-purple-300">
              {getUpsellMessage('dependencies')}
            </p>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-purple-600 dark:text-purple-400 font-semibold"
            >
              Upgrade to Pro →
            </Button>
          </div>
        </div>
      )}

      {/* Current dependencies list */}
      {dependencies.length > 0 && (
        <div className="space-y-2">
          {dependencyTasks.map((depTask) => (
            <div
              key={depTask.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md border bg-card group hover:border-primary/50 transition-colors",
                depTask.completed && "opacity-60 border-green-200 dark:border-green-900"
              )}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    depTask.completed && "line-through text-muted-foreground"
                  )}
                >
                  {depTask.title}
                </p>
                {depTask.completed ? (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ Completed
                  </p>
                ) : (
                  <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Blocking this task
                  </p>
                )}
              </div>
              {!readonly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove?.(depTask.id)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search for tasks to add */}
      {isSearching && !readonly && !dependenciesDisabled && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for tasks..."
              className="pl-8 pr-8"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setIsSearching(false)
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search results */}
          <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2 bg-card">
            {filteredTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                {searchQuery ? "No tasks found" : "No available tasks"}
              </p>
            ) : (
              filteredTasks.slice(0, 10).map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleAddDependency(task.id)}
                  className="w-full text-left p-2 rounded hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {task.description}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Limit warning / upsell */}
      {showLimitWarning && (
        <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-md">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs space-y-1">
            <p className="font-medium text-purple-900 dark:text-purple-100">
              Dependency limit reached!
            </p>
            <p className="text-purple-700 dark:text-purple-300">
              {getUpsellMessage('dependencies')}
            </p>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-purple-600 dark:text-purple-400 font-semibold"
            >
              Upgrade to Pro →
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {dependencies.length === 0 && !isSearching && !dependenciesDisabled && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No dependencies yet. Link tasks that must be completed first.
        </p>
      )}
    </div>
  )
}
