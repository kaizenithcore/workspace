"use client"

import React, { useMemo, useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Notebook } from "@/lib/notebook-types"
import NotebookCard from "./NotebookCard"

interface NotebookListProps {
  notebooks: Notebook[]
  isLoading?: boolean
  projectNames?: Record<string, string>
  categoryNames?: Record<string, string>
  onCreateNotebook?: () => void
  onDeleteNotebook?: (notebookId: string) => Promise<void>
  onEditNotebook?: (notebookId: string) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  pageSize?: number
}

/**
 * Notebook list component with grid view and search/filter
 */
export const NotebookList: React.FC<NotebookListProps> = ({
  notebooks,
  isLoading = false,
  projectNames = {},
  categoryNames = {},
  onCreateNotebook,
  onDeleteNotebook,
  onEditNotebook,
  searchQuery = "",
  onSearchChange,
  pageSize = 12,
}) => {
  const [currentPage, setCurrentPage] = useState(0)

  const filteredNotebooks = useMemo(() => {
    if (!searchQuery) return notebooks

    const query = searchQuery.toLowerCase()
    return notebooks.filter((notebook) =>
      notebook.title.toLowerCase().includes(query) ||
      notebook.description?.toLowerCase().includes(query) ||
      notebook.tags?.some((tag) => tag.toLowerCase().includes(query))
    )
  }, [notebooks, searchQuery])

  const paginatedNotebooks = useMemo(() => {
    const start = currentPage * pageSize
    return filteredNotebooks.slice(start, start + pageSize)
  }, [filteredNotebooks, currentPage, pageSize])

  const totalPages = Math.ceil(filteredNotebooks.length / pageSize)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Notebooks</h1>
          <Button onClick={onCreateNotebook}>
            <Plus className="w-4 h-4 mr-2" />
            New Notebook
          </Button>
        </div>

        {/* Search */}
        <Input
          placeholder="Search notebooks by title, description, or tags..."
          value={searchQuery}
          onChange={(e) => {
            onSearchChange?.(e.target.value)
            setCurrentPage(0)
          }}
          className="max-w-md"
        />
      </div>

      {/* No results */}
      {filteredNotebooks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "No notebooks found matching your search." : "No notebooks yet. Create one to get started!"}
          </p>
          {!searchQuery && (
            <Button onClick={onCreateNotebook}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Notebook
            </Button>
          )}
        </div>
      )}

      {/* Grid */}
      {filteredNotebooks.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 kz-stagger-auto">
            {paginatedNotebooks.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                notebook={notebook}
                projectNames={projectNames}
                categoryNames={categoryNames}
                onDelete={onDeleteNotebook}
                onEdit={onEditNotebook}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default NotebookList
