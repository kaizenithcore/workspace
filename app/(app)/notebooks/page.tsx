"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { PageTransition } from "@/components/ui/page-transition"
import { auth } from "@/lib/firebase/config"
import { useNotebooks } from "@/hooks/use-notebooks"
import { createNotebook, deleteNotebook } from "@/lib/firestore-notebooks"
import { NotebookList } from "@/components/notebook"
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
import { useToast } from "@/hooks/use-toast"

/**
 * Notebooks index page
 * Lists all user notebooks with search, filter, and create functionality
 */
export default function NotebooksPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newNotebookTitle, setNewNotebookTitle] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  const { notebooks, loading, error, refetch } = useNotebooks(user?.uid || null, {
    realtime: true,
  })

  const handleCreateNotebook = async () => {
    if (!user || !newNotebookTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a notebook title.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true)
      const notebook = await createNotebook(user.uid, {
        title: newNotebookTitle.trim(),
        description: null,
        projectIds: [],
        categoryIds: [],
        tags: [],
        ownerId: user.uid,
      })

      toast({
        title: "Notebook created",
        description: `"${notebook.title}" has been created.`,
      })

      setShowCreateDialog(false)
      setNewNotebookTitle("")
      router.push(`/notebooks/${notebook.id}`)
    } catch (error) {
      console.error("Failed to create notebook:", error)
      toast({
        title: "Failed to create notebook",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteNotebook = async (notebookId: string) => {
    if (!user) return

    try {
      await deleteNotebook(user.uid, notebookId)
      await refetch()
      toast({
        title: "Notebook deleted",
        description: "The notebook has been deleted.",
      })
    } catch (error) {
      console.error("Failed to delete notebook:", error)
      toast({
        title: "Failed to delete notebook",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view notebooks.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading notebooks: {error.message}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="p-6 lg:p-8 space-y-6">
      <NotebookList
        notebooks={notebooks}
        isLoading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateNotebook={() => setShowCreateDialog(true)}
        onDeleteNotebook={handleDeleteNotebook}
      />

      {/* Create Notebook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Notebook</DialogTitle>
            <DialogDescription>
              Give your notebook a title and get started taking notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="notebook-title" className="text-sm font-medium">
                Notebook Title
              </label>
              <Input
                id="notebook-title"
                value={newNotebookTitle}
                onChange={(e) => setNewNotebookTitle(e.target.value)}
                placeholder="My awesome notebook..."
                disabled={isCreating}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateNotebook()
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateNotebook} disabled={isCreating || !newNotebookTitle.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageTransition>
  )
}
