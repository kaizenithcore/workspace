"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Plus, Trash2, Pin, PinOff } from "lucide-react"
import { Timestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { NotebookPage } from "@/lib/notebook-types"
import { formatRelativeDate } from "@/lib/notebook-utils"
import { reorderPages, deletePage } from "@/lib/firestore-notebooks"
import { useToast } from "@/hooks/use-toast"

interface NotebookSidebarProps {
  userId: string | null
  notebookId: string
  pages: NotebookPage[]
  currentPageId?: string
  onPageSelect?: (pageId: string, index: number) => void
  onAddPage?: () => void
  onDeletePage?: (pageId: string) => Promise<void>
}

/**
 * Sidebar component for managing pages within a notebook
 * Supports drag-and-drop reordering
 */
export const NotebookSidebar: React.FC<NotebookSidebarProps> = ({
  userId,
  notebookId,
  pages,
  currentPageId,
  onPageSelect,
  onAddPage,
  onDeletePage,
}) => {
  const [isReordering, setIsReordering] = useState(false)
  const [draggedPage, setDraggedPage] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDeletePage = useCallback(
    async (pageId: string) => {
      if (!userId || !onDeletePage) return

      try {
        await onDeletePage(pageId)
        toast({
          title: "Page deleted",
          description: "The page has been deleted.",
        })
      } catch (error) {
        console.error("Failed to delete page:", error)
        toast({
          title: "Failed to delete page",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        })
      }
    },
    [userId, onDeletePage, toast]
  )

  const handleDragStart = (pageId: string) => {
    setDraggedPage(pageId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = useCallback(
    async (targetPageId: string) => {
      if (!draggedPage || draggedPage === targetPageId || !userId) return

      const draggedIndex = pages.findIndex((p) => p.id === draggedPage)
      const targetIndex = pages.findIndex((p) => p.id === targetPageId)

      if (draggedIndex === -1 || targetIndex === -1) return

      try {
        setIsReordering(true)
        const newPages = [...pages]
        const [movedPage] = newPages.splice(draggedIndex, 1)
        newPages.splice(targetIndex, 0, movedPage)

        // Update order field for all affected pages
        const pageOrders = newPages.map((p, index) => ({
          pageId: p.id,
          order: index,
        }))

        await reorderPages(userId, notebookId, pageOrders)
        setDraggedPage(null)
        toast({
          title: "Pages reordered",
          description: "Your pages have been reordered.",
        })
      } catch (error) {
        console.error("Failed to reorder pages:", error)
        toast({
          title: "Failed to reorder pages",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        })
      } finally {
        setIsReordering(false)
      }
    },
    [draggedPage, pages, userId, notebookId, toast]
  )

  return (
    <div className="flex flex-col h-full border-r bg-muted/30 w-64">
      {/* Header */}
      <div className="p-4 border-b space-y-2">
        <div className="text-sm font-semibold text-muted-foreground">Pages</div>
        <Button
          size="sm"
          className="w-full"
          onClick={onAddPage}
          disabled={isReordering}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Page
        </Button>
      </div>

      {/* Pages List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {pages.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No pages yet
            </div>
          ) : (
            pages.map((page, index) => (
              <div
                key={page.id}
                draggable={!isReordering}
                onDragStart={() => handleDragStart(page.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(page.id)}
                className={cn(
                  "p-3 rounded-lg text-sm cursor-pointer transition-colors group",
                  "hover:bg-accent hover:text-accent-foreground",
                  currentPageId === page.id && "bg-primary text-primary-foreground font-semibold",
                  draggedPage === page.id && "opacity-50"
                )}
                onClick={() => onPageSelect?.(page.id, index)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{page.title || "Untitled"}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {formatRelativeDate(page.updatedAt instanceof Timestamp ? page.updatedAt.toDate() : page.updatedAt)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePage(page.id)
                    }}
                    disabled={pages.length === 1}
                    title={pages.length === 1 ? "Cannot delete the last page" : "Delete page"}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {pages.length > 0 && (
        <div className="border-t p-4 text-xs text-muted-foreground">
          {pages.length} page{pages.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  )
}

export default NotebookSidebar
