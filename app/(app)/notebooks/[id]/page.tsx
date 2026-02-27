"use client"

import React, { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { useNotebook } from "@/hooks/use-notebook"
import { useToast } from "@/hooks/use-toast"
import { createPage, deletePage, updateNotebook } from "@/lib/firestore-notebooks"
import {
  NotebookEditor,
  NotebookSidebar,
  ConvertToEntityModal,
} from "@/components/notebook"
import { Loader2, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { ConversionResult } from "@/lib/notebook-types"

interface NotebookViewProps {
  params: Promise<{
    id: string
  }>
}

/**
 * Individual notebook view page
 * Shows all pages and the editor for the current page
 */
export default function NotebookViewPage({ params }: NotebookViewProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const notebookId = resolvedParams.id
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isHandwritingMode, setIsHandwritingMode] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const { toast } = useToast()

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  const { notebook, pages, currentPageIndex, currentPage, loading, error, goToPage, nextPage, previousPage } = useNotebook(
    user?.uid || null,
    notebookId,
    { realtime: true }
  )

  const handleAddPage = async () => {
    if (!user || !notebook) return

    try {
      const newPage = await createPage(user.uid, notebookId, {
        title: "New Page",
        content: "",
        order: pages.length,
      })

      goToPage(pages.length)
      toast({
        title: "Page created",
        description: 'A new page "New Page" has been created.',
      })
    } catch (error) {
      console.error("Failed to create page:", error)
      toast({
        title: "Failed to create page",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleDeletePage = async (pageId: string) => {
    if (!user) return

    try {
      await deletePage(user.uid, notebookId, pageId)
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
  }

  const handleConvertSelection = (text: string) => {
    setSelectedText(text)
    setShowConvertModal(true)
  }

  const handleConversionResult = async (result: ConversionResult) => {
    if (!user || !currentPage) return

    try {
      // Update the notebook to mark that it's linked to an entity
      // This is optional but useful for tracking relationships
      await updateNotebook(user.uid, notebookId, {
        updatedAt: new Date(),
      })

      toast({
        title: `${result.type} created`,
        description: `"${result.title}" has been created and linked to this page.`,
      })
    } catch (error) {
      console.error("Failed to link entity:", error)
      // Don't show error to user as the entity was already created
    }
  }

  // Wrapper to adapt goToPage signature for NotebookSidebar
  const handlePageSelect = (pageId: string, index: number) => {
    goToPage(index)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please sign in to view notebooks.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !notebook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">
          {error ? `Error: ${error.message}` : "Notebook not found"}
        </p>
        <Link href="/notebooks">
          <Button variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Notebooks
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 flex h-screen">
      {/* Sidebar */}
      <NotebookSidebar
        userId={user.uid}
        notebookId={notebookId}
        pages={pages}
        currentPageId={currentPage?.id}
        onPageSelect={handlePageSelect}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
      />

      {/* Main editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with back button */}
        <div className="border-b px-6 py-3 flex items-center gap-4">
          <Link href="/notebooks">
            <Button size="sm" variant="ghost">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">{notebook.title}</h1>
            <p className="text-xs text-muted-foreground">{notebook.pageCount} pages</p>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <NotebookEditor
            userId={user.uid}
            notebookId={notebookId}
            page={currentPage || null}
            pageIndex={currentPageIndex}
            totalPages={pages.length}
            isHandwritingMode={isHandwritingMode}
            onToggleHandwriting={setIsHandwritingMode}
            onNextPage={nextPage}
            onPreviousPage={previousPage}
            onAddPage={handleAddPage}
            onConvertSelection={handleConvertSelection}
          />
        </div>
      </div>

      {/* Convert Modal */}
      <ConvertToEntityModal
        userId={user?.uid || ""}
        open={showConvertModal}
        selectedText={selectedText}
        fullPageContent={currentPage?.content || ""}
        notebookId={notebookId}
        pageId={currentPage?.id || ""}
        onOpenChange={setShowConvertModal}
        onConvert={handleConversionResult}
      />
    </div>
  )
}
