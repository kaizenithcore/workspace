"use client"

import React, { useState } from "react"
import { Plus, Check, X, GripVertical, Trash2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useTaskLimits } from "@/hooks/use-task-limits"
import type { Subtask } from "@/lib/types"

interface SubtaskListProps {
  subtasks: Subtask[]
  onAdd?: (title: string) => void
  onToggle?: (subtaskId: string) => void
  onDelete?: (subtaskId: string) => void
  onReorder?: (subtasks: Subtask[]) => void
  readonly?: boolean
}

export function SubtaskList({
  subtasks = [],
  onAdd,
  onToggle,
  onDelete,
  onReorder,
  readonly = false,
}: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [recentlyCompletedId, setRecentlyCompletedId] = useState<string | null>(null)
  const { canAddSubtask, getUpsellMessage, isPro, limits } = useTaskLimits()

  const completedCount = subtasks.filter((st) => st.completed).length
  const totalCount = subtasks.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return

    const validation = canAddSubtask(subtasks.length)
    if (!validation.allowed) {
      alert(getUpsellMessage('subtasks'))
      return
    }

    onAdd?.(newSubtaskTitle.trim())
    setNewSubtaskTitle("")
    setIsAdding(false)
  }

  const handleToggleSubtask = (subtaskId: string) => {
    setRecentlyCompletedId(subtaskId)
    setTimeout(() => setRecentlyCompletedId(null), 600)
    onToggle?.(subtaskId)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddSubtask()
    } else if (e.key === "Escape") {
      setNewSubtaskTitle("")
      setIsAdding(false)
    }
  }

  const canAddMore = canAddSubtask(subtasks.length).allowed
  const showLimitWarning = subtasks.length >= limits.subtasksPerTask && !isPro

  return (
    <div className="space-y-3">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Subtasks ({completedCount}/{totalCount})
          </span>
          {!isPro && (
            <span className="text-xs text-muted-foreground">
              ({subtasks.length}/{limits.subtasksPerTask} used)
            </span>
          )}
        </div>
        {!readonly && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={!canAddMore}
            className="h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Subtask
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors group",
              subtask.completed && "opacity-60",
              recentlyCompletedId === subtask.id && "animate-pulse"
            )}
          >
            {!readonly && (
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={() => handleToggleSubtask(subtask.id)}
              disabled={readonly}
              className="shrink-0"
            />
            <span
              className={cn(
                "flex-1 text-sm",
                subtask.completed && "line-through text-muted-foreground"
              )}
            >
              {subtask.title}
            </span>
            {!readonly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(subtask.id)}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add new subtask input */}
      {isAdding && !readonly && (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
          <Checkbox disabled className="shrink-0" />
          <Input
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New subtask title..."
            className="flex-1 h-8 border-0 focus-visible:ring-0 px-0"
            autoFocus
          />
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddSubtask}
              className="h-6 w-6 p-0"
            >
              <Check className="w-4 h-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setNewSubtaskTitle("")
                setIsAdding(false)
              }}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      )}

      {/* Limit warning / upsell */}
      {showLimitWarning && (
        <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-md">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs space-y-1">
            <p className="font-medium text-purple-900 dark:text-purple-100">
              Subtask limit reached!
            </p>
            <p className="text-purple-700 dark:text-purple-300">
              {getUpsellMessage('subtasks')}
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
      {totalCount === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No subtasks yet. Break this task into smaller steps!
        </p>
      )}
    </div>
  )
}
