"use client"

import React from "react"
import Link from "next/link"
import { MoreVertical, Trash2, Edit2 } from "lucide-react"
import { Timestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import type { Notebook } from "@/lib/notebook-types"
import { truncateText, generateSnippet, formatRelativeDate } from "@/lib/notebook-utils"
import { useState } from "react"

interface NotebookCardProps {
  notebook: Notebook
  snippet?: string
  projectNames?: Record<string, string>
  categoryNames?: Record<string, string>
  onDelete?: (notebookId: string) => Promise<void>
  onEdit?: (notebookId: string) => void
}

/**
 * Notebook card component for displaying in grid/list view
 */
export const NotebookCard: React.FC<NotebookCardProps> = ({
  notebook,
  snippet,
  projectNames = {},
  categoryNames = {},
  onDelete,
  onEdit,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return

    try {
      setIsDeleting(true)
      await onDelete(notebook.id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Failed to delete notebook:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Link href={`/notebooks/${notebook.id}`}>
        <Card hover className="cursor-pointer h-full">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="line-clamp-2">{notebook.title}</CardTitle>
                <CardDescription className="mt-1">
                  {notebook.pageCount} page{notebook.pageCount !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault()
                    onEdit?.(notebook.id)
                  }}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      setShowDeleteDialog(true)
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Snippet */}
            {snippet && (
              <p className="text-sm text-muted-foreground line-clamp-3">{snippet}</p>
            )}

            {/* Tags/Badges */}
            <div className="flex flex-wrap gap-2">
              {notebook.projectIds.slice(0, 2).map((projectId) => (
                <Badge key={projectId} variant="secondary" className="text-xs">
                  {projectNames[projectId] || projectId}
                </Badge>
              ))}
              {notebook.categoryIds.slice(0, 2).map((categoryId) => (
                <Badge key={categoryId} variant="outline" className="text-xs">
                  {categoryNames[categoryId] || categoryId}
                </Badge>
              ))}
              {notebook.projectIds.length + notebook.categoryIds.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{notebook.projectIds.length + notebook.categoryIds.length - 4}
                </Badge>
              )}
            </div>

            {/* Metadata */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Updated {formatRelativeDate(notebook.updatedAt instanceof Timestamp ? notebook.updatedAt.toDate() : notebook.updatedAt)}</p>
              <p>Created {formatRelativeDate(notebook.createdAt instanceof Timestamp ? notebook.createdAt.toDate() : notebook.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Notebook</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{notebook.title}"? This will also delete all {notebook.pageCount} pages inside it. This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default NotebookCard
