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
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect } from "@/components/ui/multi-select"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useDataStore } from "@/lib/hooks/use-data-store"

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
  const [newNotebookDescription, setNewNotebookDescription] = useState("")
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const { t } = useI18n()
  const { categories, projects } = useDataStore()

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
        title: t("notebooks.titleRequired"),
        description: t("notebooks.enterTitle"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true)
      const notebook = await createNotebook(user.uid, {
        title: newNotebookTitle.trim(),
        description: newNotebookDescription.trim() || null,
        projectIds: selectedProjectIds,
        categoryIds: selectedCategoryIds,
        tags: [],
        ownerId: user.uid,
      })

      toast({
        title: t("notebooks.notebookCreatedSuccess"),
        description: `"${notebook.title}" ${t("notebooks.hasBeenCreated")}`,
      })

      setShowCreateDialog(false)
      setNewNotebookTitle("")
      setNewNotebookDescription("")
      setSelectedCategoryIds([])
      setSelectedProjectIds([])
      router.push(`/notebooks/${notebook.id}`)
    } catch (error) {
      console.error("Failed to create notebook:", error)
      toast({
        title: t("notebooks.failedToCreate"),
        description: error instanceof Error ? error.message : t("notebooks.unknownError"),
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
        title: t("notebooks.notebookDeletedSuccess"),
        description: t("notebooks.notebookHasBeenDeleted"),
      })
    } catch (error) {
      console.error("Failed to delete notebook:", error)
      toast({
        title: t("notebooks.failedToDelete"),
        description: error instanceof Error ? error.message : t("notebooks.unknownError"),
        variant: "destructive",
      })
    }
  }

  // Build name maps for displaying project/category names in cards
  const projectNames = React.useMemo(() => {
    const map: Record<string, string> = {}
    projects.forEach((p) => {
      map[p.id] = p.name
    })
    return map
  }, [projects])

  const categoryNames = React.useMemo(() => {
    const map: Record<string, string> = {}
    categories.forEach((c) => {
      map[c.id] = c.name
    })
    return map
  }, [categories])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t("notebooks.signInToView")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">{t("notebooks.errorLoading")} {error.message}</p>
          <Button onClick={() => refetch()}>{t("notebooks.retry")}</Button>
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
        onUpdateNotebook={refetch}
        userId={user?.uid}
        projectNames={projectNames}
        categoryNames={categoryNames}
      />

      {/* Create Notebook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("notebooks.createNotebookTitle")}</DialogTitle>
            <DialogDescription>
              {t("notebooks.createNotebookDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="notebook-title" className="text-sm font-medium">
                {t("notebooks.notebookTitleLabel")}
              </label>
              <Input
                id="notebook-title"
                value={newNotebookTitle}
                onChange={(e) => setNewNotebookTitle(e.target.value)}
                placeholder={t("notebooks.notebookTitlePlaceholder")}
                disabled={isCreating}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    handleCreateNotebook()
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="notebook-description" className="text-sm font-medium">
                {t("description")} {t("optional")}
              </label>
              <Textarea
                id="notebook-description"
                value={newNotebookDescription}
                onChange={(e) => setNewNotebookDescription(e.target.value)}
                placeholder={t("notebooks.descriptionPlaceholder")}
                disabled={isCreating}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("projects")} {t("optional")}
              </label>
              <MultiSelect
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
                selected={selectedProjectIds}
                onChange={setSelectedProjectIds}
                placeholder={t("selectProjects")}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("categories")} {t("optional")}
              </label>
              <MultiSelect
                options={categories.map((c) => ({ value: c.id, label: c.name, color: c.color }))}
                selected={selectedCategoryIds}
                onChange={setSelectedCategoryIds}
                placeholder={t("selectCategories")}
                disabled={isCreating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleCreateNotebook} disabled={isCreating || !newNotebookTitle.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("creating")}...
                </>
              ) : (
                t("create")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageTransition>
  )
}
