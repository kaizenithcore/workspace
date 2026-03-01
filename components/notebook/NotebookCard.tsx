"use client"

import React from "react"
import Link from "next/link"
import { MoreVertical, Trash2, Edit2 } from "lucide-react"
import { Timestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect } from "@/components/ui/multi-select"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useDataStore } from "@/lib/hooks/use-data-store"
import { useToast } from "@/hooks/use-toast"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Notebook } from "@/lib/notebook-types"
import { truncateText, generateSnippet, formatRelativeDate } from "@/lib/notebook-utils"
import { updateNotebook } from "@/lib/firestore-notebooks"
import { useState } from "react"

interface NotebookCardProps {
  notebook: Notebook
  snippet?: string
  projectNames?: Record<string, string>
  categoryNames?: Record<string, string>
  userId: string
  onDelete?: (notebookId: string) => Promise<void>
  onEdit?: (notebookId: string) => void
  onUpdate?: () => Promise<void>
}

/**
 * Notebook card component for displaying in grid/list view
 */
export const NotebookCard: React.FC<NotebookCardProps> = ({
  notebook,
  snippet,
  projectNames = {},
  categoryNames = {},
  userId,
  onDelete,
  onEdit,
  onUpdate,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editTitle, setEditTitle] = useState(notebook.title)
  const [editDescription, setEditDescription] = useState(notebook.description || "")
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>(notebook.categoryIds)
  const [editProjectIds, setEditProjectIds] = useState<string[]>(notebook.projectIds)
  
  const { cardClassName } = useCardTransparency()
  const { t } = useI18n()
  const { categories, projects } = useDataStore()
  const { toast } = useToast()

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

  const handleEdit = () => {
    setEditTitle(notebook.title)
    setEditDescription(notebook.description || "")
    setEditCategoryIds(notebook.categoryIds)
    setEditProjectIds(notebook.projectIds)
    setShowEditDialog(true)
  }

  const handleUpdate = async () => {
    if (!editTitle.trim()) {
      toast({
        title: t("notebooks.titleRequired"),
        description: t("notebooks.enterTitle"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsUpdating(true)
      await updateNotebook(userId, notebook.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        categoryIds: editCategoryIds,
        projectIds: editProjectIds,
      })

      toast({
        title: t("notebooks.notebookUpdatedSuccess"),
        description: `"${editTitle}" ${t("notebooks.hasBeenUpdated")}`,
      })

      setShowEditDialog(false)
      if (onUpdate) {
        await onUpdate()
      }
    } catch (error) {
      console.error("Failed to update notebook:", error)
      toast({
        title: t("notebooks.failedToUpdate"),
        description: error instanceof Error ? error.message : t("notebooks.unknownError"),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <Link href={`/notebooks/${notebook.id}`}>
        <Card hover className={cn("cursor-pointer h-full", cardClassName)}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="line-clamp-2">{notebook.title}</CardTitle>
                <CardDescription className="mt-1">
                  {notebook.pageCount} {notebook.pageCount !== 1 ? t("notebooks.pages") : t("notebooks.pageCountSingular")}
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
                    handleEdit()
                  }}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    {t("notebooks.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      setShowDeleteDialog(true)
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t("delete")}
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
              <p>{t("notebooks.updatedAt")}: {formatRelativeDate(notebook.updatedAt instanceof Timestamp ? notebook.updatedAt.toDate() : notebook.updatedAt)}</p>
              <p>{t("notebooks.createdAt")}: {formatRelativeDate(notebook.createdAt instanceof Timestamp ? notebook.createdAt.toDate() : notebook.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t("notebooks.editNotebookTitle")}</DialogTitle>
            <DialogDescription>{t("notebooks.editNotebookDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-title" className="text-sm font-medium">
                {t("notebooks.notebookTitleLabel")}
              </label>
              <Input
                id="edit-title"
                placeholder={t("notebooks.notebookTitlePlaceholder")}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-description" className="text-sm font-medium">
                {t("description")}
              </label>
              <Textarea
                id="edit-description"
                placeholder={t("notebooks.descriptionPlaceholder")}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("selectProjects")}</label>
              <MultiSelect
                options={projects.map((p) => ({ label: p.name, value: p.id }))}
                selected={editProjectIds}
                onChange={setEditProjectIds}
                placeholder={t("selectProjects")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("selectCategories")}</label>
              <MultiSelect
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
                selected={editCategoryIds}
                onChange={setEditCategoryIds}
                placeholder={t("selectCategories")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? t("notebooks.updating") : t("notebooks.updateNotebook")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>{t("notebooks.deleteNotebook")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("notebooks.deleteNotebookConfirmation")
              .replace("{title}", notebook.title)
              .replace("{pageCount}", String(notebook.pageCount))}
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("notebooks.deleting") : t("delete")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default NotebookCard
