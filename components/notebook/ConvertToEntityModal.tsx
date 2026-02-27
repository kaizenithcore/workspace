"use client"

import React, { useCallback, useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { selectedTextToTaskTitle } from "@/lib/notebook-utils"
import type { ConversionRequest, ConversionResult } from "@/lib/notebook-types"
import { createTask } from "@/lib/firestore"

interface ConvertToEntityModalProps {
  userId: string
  open: boolean
  selectedText: string
  fullPageContent: string
  notebookId: string
  pageId: string
  projects?: Array<{ id: string; name: string }>
  categories?: Array<{ id: string; name: string }>
  onOpenChange?: (open: boolean) => void
  onConvert?: (result: ConversionResult) => void
}

/**
 * Modal for converting selected text into tasks, sessions, or goals
 */
export const ConvertToEntityModal: React.FC<ConvertToEntityModalProps> = ({
  userId,
  open,
  selectedText,
  fullPageContent,
  notebookId,
  pageId,
  projects = [],
  categories = [],
  onOpenChange,
  onConvert,
}) => {
  const [entityType, setEntityType] = useState<"task" | "session" | "goal">("task")
  const [title, setTitle] = useState(selectedTextToTaskTitle(selectedText))
  const [description, setDescription] = useState(selectedText)
  const [projectId, setProjectId] = useState<string>("none")
  const [categoryId, setCategoryId] = useState<string>("none")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleConvert = useCallback(async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the new item.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        projectId: projectId && projectId !== "none" ? projectId : undefined,
        categoryIds: categoryId && categoryId !== "none" ? [categoryId] : [],
        completed: false,
        archived: false,
        tags: [],
        priority: "medium" as const,
        order: 0,
      }

      let result: ConversionResult | null = null

      if (entityType === "task") {
        // Create task
        try {
          const taskId = await createTask({
            ...taskData,
            userId,
            ownerId: userId,
          })
          result = {
            type: "task",
            id: taskId,
            title: taskData.title,
            linkedAt: new Date(),
          }
        } catch (error) {
          console.error("Failed to create task:", error)
          throw new Error("Failed to create task")
        }
      } else if (entityType === "session") {
        // Session creation logic - adapt to your firestore-sessions module
        // For now, we'll show a placeholder
        throw new Error("Session conversion not yet implemented")
      } else if (entityType === "goal") {
        // Goal creation logic - adapt to your goals firestore module
        throw new Error("Goal conversion not yet implemented")
      }

      if (result) {
        onConvert?.(result)
        toast({
          title: "Item created",
          description: `${entityType} has been created and linked to this page.`,
        })
        onOpenChange?.(false)
        resetForm()
      }
    } catch (error) {
      console.error("Conversion error:", error)
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "Unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [title, description, entityType, projectId, categoryId, onConvert, onOpenChange, toast])

  const resetForm = useCallback(() => {
    setTitle(selectedTextToTaskTitle(selectedText))
    setDescription(selectedText)
    setProjectId("")
    setCategoryId("")
  }, [selectedText])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create from Selection</DialogTitle>
          <DialogDescription>
            Convert the selected text into a task, session, or goal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Entity Type */}
          <div className="space-y-2">
            <Label htmlFor="entity-type">What would you like to create?</Label>
            <Select value={entityType} onValueChange={(value: any) => setEntityType(value)}>
              <SelectTrigger id="entity-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="session">Session</SelectItem>
                <SelectItem value="goal">Goal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Item title..."
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* Project */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="project">Project (optional)</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              `Create ${entityType}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConvertToEntityModal
