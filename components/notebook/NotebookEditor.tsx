"use client"

import React, { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Copy, Plus, Settings2, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAutosave } from "@/hooks/use-autosave"
import { useToast } from "@/hooks/use-toast"
import type { NotebookPage } from "@/lib/notebook-types"
import { updatePage } from "@/lib/firestore-notebooks"
import { formatRelativeDate } from "@/lib/notebook-utils"
import "./notebook-editor.css"

interface NotebookEditorProps {
  userId: string | null
  notebookId: string
  page: NotebookPage | null
  pageIndex: number
  totalPages: number
  isHandwritingMode?: boolean
  onPageTitleChange?: (title: string) => void
  onToggleHandwriting?: (enabled: boolean) => void
  onNextPage?: () => void
  onPreviousPage?: () => void
  onAddPage?: () => void
  onConvertSelection?: (selectedText: string) => void
}

/**
 * Main notebook page editor component
 * Supports markdown editing, preview mode, and autosave
 */
export const NotebookEditor: React.FC<NotebookEditorProps> = ({
  userId,
  notebookId,
  page,
  pageIndex,
  totalPages,
  isHandwritingMode = false,
  onPageTitleChange,
  onToggleHandwriting,
  onNextPage,
  onPreviousPage,
  onAddPage,
  onConvertSelection,
}) => {
  const [content, setContent] = useState("")
  const [pageTitle, setPageTitle] = useState("")
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const { toast } = useToast()

  // Sync page data when it changes
  useEffect(() => {
    if (page) {
      setContent(page.content)
      setPageTitle(page.title)
    }
  }, [page?.id, page?.content, page?.title])

  // Autosave implementation
  const autosave = useAutosave(content, {
    delay: 800,
    onSave: async (value) => {
      if (!userId || !page) return
      try {
        await updatePage(userId, notebookId, page.id, {
          content: value,
        })
      } catch (error) {
        console.error("Failed to save page content:", error)
        throw error
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Autosave for page title
  const titleAutosave = useAutosave(pageTitle, {
    delay: 1000,
    onSave: async (value) => {
      if (!userId || !page) return
      try {
        await updatePage(userId, notebookId, page.id, {
          title: value || "Untitled",
        })
      } catch (error) {
        console.error("Failed to save page title:", error)
        throw error
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to save title",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    autosave.markDirty()
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setPageTitle(newTitle)
    titleAutosave.markDirty()
    onPageTitleChange?.(newTitle)
  }

  const handleSelectionForConversion = () => {
    const textarea = document.getElementById(`editor-${page?.id}`) as HTMLTextAreaElement
    if (textarea) {
      const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
      if (selectedText.trim()) {
        onConvertSelection?.(selectedText)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + S: manual save
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault()
      autosave.save()
    }
    // Ctrl/Cmd + Enter: new page
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      onAddPage?.()
    }
    // Alt + Left arrow: previous page
    if (e.altKey && e.key === "ArrowLeft") {
      e.preventDefault()
      onPreviousPage?.()
    }
    // Alt + Right arrow: next page
    if (e.altKey && e.key === "ArrowRight") {
      e.preventDefault()
      onNextPage?.()
    }
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div>
          <p className="text-muted-foreground">No page selected</p>
          <Button onClick={onAddPage} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Create First Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-70% bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 space-y-4">
        {/* Title and Save Status */}
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2 justify-">
            <Input
              value={pageTitle}
              onChange={handleTitleChange}
              placeholder="Page title..."
              className="text-xl font-bold border-none px-2 focus-visible:ring-0"
            />
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2 ms-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              title={isPreviewMode ? "Enter edit mode" : "Preview mode"}
            >
              {isPreviewMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleHandwriting?.(!isHandwritingMode)}
              title={isHandwritingMode ? "Disable handwriting mode" : "Enable handwriting mode"}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground space-x-4 flex items-center">
              <span>
                {autosave.isSaving ? "Saving..." : autosave.lastSavedAt ? `Saved ${formatRelativeDate(autosave.lastSavedAt)}` : "Not saved"}
              </span>
              {autosave.error && <span className="text-destructive">Error: {autosave.error.message}</span>}
            </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onPreviousPage}
            disabled={pageIndex === 0}
            title="Alt + ← (previous page)"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pageIndex + 1} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={onNextPage}
            disabled={pageIndex === totalPages - 1}
            title="Alt + → (next page)"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onAddPage}
            title="Ctrl/Cmd + Enter (new page)"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Page
          </Button>
        </div>
      </div>

      {/* Editor or Preview */}
      <div className="flex-1 overflow-hidden">
        {isPreviewMode ? (
          <NotebookPreview content={content} />
        ) : (
          <textarea
            id={`editor-${page.id}`}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Start typing... Markdown supported. Ctrl+S to save, Ctrl+Enter for new page, Alt+← → to navigate."
            className={cn(
              "w-full h-full p-8 resize-none focus:outline-none text-foreground bg-background",
              "font-mono text-sm leading-relaxed notebook-paper",
              isHandwritingMode && "handwriting"
            )}
            spellCheck="true"
            style={{
              backgroundAttachment: "local",
              backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.02))",
              backgroundPosition: "0 1.5em",
              backgroundRepeat: "repeat-y",
              backgroundSize: "100% 1.5em",
            }}
          />
        )}
      </div>

      {/* Footer */}
      {!isPreviewMode && (
        <div className="border-t px-6 py-3 flex items-center justify-between">
          <Button size="sm" variant="outline" onClick={handleSelectionForConversion} disabled={!content}>
            <Copy className="w-4 h-4 mr-2" />
            Convert Selection
          </Button>
          <div className="text-xs text-muted-foreground">
            {content.length} characters · {content.split(/\s+/).length} words
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Simple markdown preview component
 */
interface NotebookPreviewProps {
  content: string
}

function NotebookPreview({ content }: NotebookPreviewProps) {
  return (
    <div className="p-8 overflow-auto h-full prose prose-sm dark:prose-invert max-w-none">
      {/* Simple markdown rendering */}
      {content.split("\n").map((line, i) => {
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-3xl font-bold mt-6 mb-3">
              {line.replace("# ", "")}
            </h1>
          )
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-2xl font-bold mt-5 mb-2">
              {line.replace("## ", "")}
            </h2>
          )
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="text-xl font-bold mt-4 mb-2">
              {line.replace("### ", "")}
            </h3>
          )
        }
        if (line.startsWith("- ")) {
          return (
            <li key={i} className="ml-4">
              {line.replace("- ", "")}
            </li>
          )
        }
        if (line.startsWith("* ")) {
          return (
            <li key={i} className="ml-4">
              {line.replace("* ", "")}
            </li>
          )
        }
        if (line.startsWith("> ")) {
          return (
            <blockquote key={i} className="border-l-4 border-primary pl-4 italic">
              {line.replace("> ", "")}
            </blockquote>
          )
        }
        if (line.trim() === "") {
          return <div key={i} className="h-4" />
        }
        return (
          <p key={i} className="mb-2 leading-relaxed">
            {line}
          </p>
        )
      })}
    </div>
  )
}

export default NotebookEditor
