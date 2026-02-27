"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor, Plus, Trash2, Check, Edit2, GripVertical, CreditCard, AlertCircle } from "lucide-react"
import { PageTransition } from "@/components/ui/page-transition"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAppSettings } from "@/lib/hooks/use-app-settings"
import { useDataStore } from "@/lib/hooks/use-data-store"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useUser } from "@/lib/firebase/hooks"
import { useUserDocument } from "@/lib/hooks/use-user-document"
import { deleteUserData, updateUserPreferences } from "@/lib/firestore-user"
import { cn } from "@/lib/utils"
import type { Language } from "@/lib/i18n/translations"
import { useToast } from "@/hooks/use-toast"
import { Category, Project } from "@/lib/types" // Import Category and Project types
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"
import { deleteUser } from "firebase/auth"
import { useUserPlan } from "@/hooks/use-user-plan"
import { validateProjectCount, validateCategoryCount } from "@/lib/task-limits"
import { ProLimitModal, type LimitType } from "@/components/pro/pro-limit-modal"
const PRESET_COLORS = [
  "#3B82F6",
  "#10B981",
  "#FF6B35",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
];

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useAppSettings()
  const { categories, projects, addCategory, addProject, deleteCategory, deleteProject, updateCategory, updateProject } = useDataStore()
  const { t, language, setLanguage } = useI18n()
  const { user } = useUser()
  const { userDoc } = useUserDocument(user?.uid)
  const { toast } = useToast()
  const { plan, isPro, limits } = useUserPlan()

  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false)
  const [limitModalOpen, setLimitModalOpen] = React.useState(false)
  const [limitType, setLimitType] = React.useState<LimitType>("projects")
  const [limitCount, setLimitCount] = React.useState(0)


  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newCategoryColor, setNewCategoryColor] = React.useState(
    PRESET_COLORS[0],
  );
  const [newProjectName, setNewProjectName] = React.useState("");
  const [newProjectColor, setNewProjectColor] = React.useState(
    PRESET_COLORS[2],
  );
  // Edit states
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = React.useState("")
  const [editingCategoryColor, setEditingCategoryColor] = React.useState("")
  const [editingProjectId, setEditingProjectId] = React.useState<string | null>(null)
  const [editingProjectName, setEditingProjectName] = React.useState("")
  const [editingProjectColor, setEditingProjectColor] = React.useState("")

  // Local state for custom background settings
  const [customBackgroundUrl, setCustomBackgroundUrl] = React.useState("");
  const [enableCustomBg, setEnableCustomBg] = React.useState(false);
  const [isSavingBackground, setIsSavingBackground] = React.useState(false);

  const { cardClassName } = useCardTransparency();

  const dndSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const [orderedCategories, setOrderedCategories] = React.useState<Category[]>([])
  const [orderedProjects, setOrderedProjects] = React.useState<Project[]>([])
  const [isDraggingCategories, setIsDraggingCategories] = React.useState(false)
  const [isDraggingProjects, setIsDraggingProjects] = React.useState(false)

  React.useEffect(() => {
    const next = [...categories].sort(
      (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER),
    )
    setOrderedCategories(next)
  }, [categories])

  React.useEffect(() => {
    const next = [...projects].sort(
      (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER),
    )
    setOrderedProjects(next)
  }, [projects])

  // Sync local state with Firestore user preferences (no writes from here)
React.useEffect(() => {
  if (!userDoc?.preferences) return;

  console.log("[Settings] userDoc.preferences changed:", userDoc.preferences);

  // Sync background preview state
  const bgUrl = userDoc.preferences.backgroundImageUrl || ""
  setCustomBackgroundUrl(bgUrl)
  setEnableCustomBg(Boolean(bgUrl))

  // Sync theme (this is only UI update, handleThemeChange will write when user clicks buttons)
  if (userDoc.preferences.theme && userDoc.preferences.theme !== theme) {
    console.log("[Settings] Applying theme from Firestore:", userDoc.preferences.theme);
    setTheme(userDoc.preferences.theme);
  }

  // DO NOT call setLanguage(userDoc.preferences.language) here.
  // The I18nProvider is responsible for applying language from Firestore to the app.
}, [userDoc?.preferences, theme, setTheme]);


  // Save theme to Firestore
  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    if (user) {
      try {
        await updateUserPreferences(user.uid, {
          theme: newTheme as "light" | "dark" | "system",
        });
      } catch (err) {
        console.error("[Settings] Error saving theme:", err);
        toast({
          title: "Error",
          description: "Failed to save theme preference",
          variant: "destructive",
        });
      }
    }
  };

  // Save language to Firestore
  const handleLanguageChange = async (newLang: Language) => {
    setLanguage(newLang);
    console.log("[Settings] onValueChange fired:", newLang);

    if (user) {
      try {
        await updateUserPreferences(user.uid, { language: newLang });
      } catch (err) {
        console.error("[Settings] Error saving language:", err);
        toast({
          title: "Error",
          description: "Failed to save language preference",
          variant: "destructive",
        });
      }
    }
  };

  // Save card transparency to Firestore
  const handleCardTransparencyChange = async (checked: boolean) => {
    if (!user) return;

    try {
      await updateUserPreferences(user.uid, { cardTransparency: checked });
      toast({
        title: t("saved"),
        description: "Card transparency setting updated",
      });
    } catch (err) {
      console.error("[Settings] Error saving card transparency:", err);
      toast({
        title: "Error",
        description: "Failed to save card transparency",
        variant: "destructive",
      });
    }
  };

  const handleEnableCustomBgChange = async (checked: boolean) => {
    setEnableCustomBg(checked)

    if (!user) return

    const trimmedUrl = customBackgroundUrl.trim()
    const bgUrl = checked && trimmedUrl ? trimmedUrl : null

    try {
      console.log("[Settings] Toggling custom background ->", bgUrl)
      await updateUserPreferences(user.uid, { backgroundImageUrl: bgUrl })
      toast({
        title: t("saved"),
        description: t("backgroundSaved") || "Background updated",
      })
    } catch (err) {
      console.error("[Settings] Error toggling background:", err)
      toast({
        title: "Error",
        description: t("errorSavingProfile"),
        variant: "destructive",
      })
    }
};


  // Save custom background to Firestore
  const handleSaveCustomBackground = async () => {
    if (!user) return;

    setIsSavingBackground(true);

    try {
      const bgUrl =
        enableCustomBg && customBackgroundUrl.trim()
          ? customBackgroundUrl.trim()
          : null
      await updateUserPreferences(user.uid, { backgroundImageUrl: bgUrl })

      toast({
        title: t("saved"),
        description: "Background image updated successfully",
      });
    } catch (err) {
      console.error("[Settings] Error saving custom background:", err);
      toast({
        title: "Error",
        description: t("errorSavingProfile"),
        variant: "destructive",
      });
    } finally {
      setIsSavingBackground(false);
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      // Check category limit for Free users
      const validation = validateCategoryCount(categories.length, plan)
      if (!validation.allowed) {
        setLimitType("categories")
        setLimitCount(validation.limit || 5)
        setLimitModalOpen(true)
        return
      }

      addCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
        order: categories.length,
      });
      setNewCategoryName("");
    }
  };

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      // Check project limit for Free users
      const validation = validateProjectCount(projects.length, plan)
      if (!validation.allowed) {
        setLimitType("projects")
        setLimitCount(validation.limit || 5)
        setLimitModalOpen(true)
        return
      }

      addProject({
        name: newProjectName.trim(),
        color: newProjectColor,
        categoryIds: [],
        isDefault: false,
        order: projects.length,
      });
      setNewProjectName("");
    }
  };
   const handleStartEditCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setEditingCategoryName(category.name)
    setEditingCategoryColor(category.color)
  }

  const handleSaveEditCategory = async () => {
    if (editingCategoryId && editingCategoryName.trim()) {
      await updateCategory(editingCategoryId, {
        name: editingCategoryName.trim(),
        color: editingCategoryColor,
      })
      setEditingCategoryId(null)
      toast({
        title: t("saved"),
        description: `${t("category")} "${editingCategoryName}" ${t("updated")}`,
      })
    }
  }

  const handleStartEditProject = (project: Project) => {
    setEditingProjectId(project.id)
    setEditingProjectName(project.name)
    setEditingProjectColor(project.color)
  }

  const handleSaveEditProject = async () => {
    if (editingProjectId && editingProjectName.trim()) {
      await updateProject(editingProjectId, {
        name: editingProjectName.trim(),
        color: editingProjectColor,
      })
      setEditingProjectId(null)
      toast({
        title: t("saved"),
        description: `${t("project")} "${editingProjectName}" ${t("updated")}`,
      })
    }
  }

  const handleReorderCategories = async (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return

    const newCategories = Array.from(orderedCategories)
    const [movedCategory] = newCategories.splice(startIndex, 1)
    newCategories.splice(endIndex, 0, movedCategory)

    const reordered = newCategories.map((cat, idx) => ({ ...cat, order: idx }))
    setOrderedCategories(reordered)

    // Update order for affected categories
    await Promise.all(
      reordered.map((cat, idx) =>
        updateCategory(cat.id, { order: idx })
      )
    )
  }

  const handleReorderProjects = async (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return

    const newProjects = Array.from(orderedProjects)
    const [movedProject] = newProjects.splice(startIndex, 1)
    newProjects.splice(endIndex, 0, movedProject)

    const reordered = newProjects.map((proj, idx) => ({ ...proj, order: idx }))
    setOrderedProjects(reordered)

    // Update order for affected projects
    await Promise.all(
      reordered.map((proj, idx) =>
        updateProject(proj.id, { order: idx })
      )
    )
  }

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setIsDraggingCategories(false)
    if (!over || active.id === over.id) return

    const startIndex = orderedCategories.findIndex((cat) => cat.id === active.id)
    const endIndex = orderedCategories.findIndex((cat) => cat.id === over.id)
    if (startIndex === -1 || endIndex === -1) return

    handleReorderCategories(startIndex, endIndex)
  }

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setIsDraggingProjects(false)
    if (!over || active.id === over.id) return

    const startIndex = orderedProjects.findIndex((proj) => proj.id === active.id)
    const endIndex = orderedProjects.findIndex((proj) => proj.id === over.id)
    if (startIndex === -1 || endIndex === -1) return

    handleReorderProjects(startIndex, endIndex)
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    const isSpanish = language === "es"
    setIsDeletingAccount(true)

    console.log("[Settings] Starting account deletion for uid:", user.uid)
    console.log("[Settings] Current user auth state:", {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
    })

    try {
      await deleteUserData(user.uid)
      console.log("[Settings] deleteUserData completed, now deleting auth user")
      await deleteUser(user)
      console.log("[Settings] Auth user deleted successfully")
      router.push("/auth")
    } catch (err: any) {
      console.error("[Settings] Error deleting account:", err)
      console.error("[Settings] Error code:", err?.code)
      console.error("[Settings] Error message:", err?.message)

      const errorCode = err?.code || err?.message
      const description =
        errorCode === "auth/requires-recent-login"
          ? isSpanish
            ? "Vuelve a iniciar sesion y repite la accion."
            : "Please sign in again and retry."
          : isSpanish
            ? "No se pudo eliminar la cuenta. Intentalo de nuevo."
            : "Could not delete account. Please try again."

      toast({
        title: isSpanish ? "Error" : "Error",
        description,
        variant: "destructive",
      })
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const SortableCategoryItem = ({
    category,
    onEdit,
    onDelete,
  }: {
    category: Category
    onEdit: (category: Category) => void
    onDelete: (categoryId: string) => void
  }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
      id: category.id,
    })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    return (
      <div
        ref={setNodeRef}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card group transition-shadow",
          isDragging && "opacity-50 shadow-lg",
          isOver && "ring-2 ring-primary/60 bg-primary/5",
        )}
        style={{ ...style, borderColor: category.color }}
      >
        <button
          className="cursor-grab touch-none opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
        <span className="text-sm">{category.name}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(category)}
            className="p-0.5 rounded hover:bg-muted"
            aria-label={t("edit")}
          >
            <Edit2 className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="p-0.5 rounded hover:bg-muted"
            aria-label={t("delete")}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    )
  }

  const SortableProjectItem = ({
    project,
    onEdit,
    onDelete,
  }: {
    project: Project
    onEdit: (project: Project) => void
    onDelete: (projectId: string) => void
  }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
      id: project.id,
    })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    return (
      <div
        ref={setNodeRef}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card group transition-shadow",
          isDragging && "opacity-50 shadow-lg",
          isOver && "ring-2 ring-primary/60 bg-primary/5",
        )}
        style={{ ...style, borderColor: project.color }}
      >
        <button
          className="cursor-grab touch-none opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
        <span className="text-sm">{project.name}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(project)}
            className="p-0.5 rounded hover:bg-muted"
            aria-label={t("edit")}
          >
            <Edit2 className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="p-0.5 rounded hover:bg-muted"
            aria-label={t("delete")}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("settings")}</h1>
        <p className="text-muted-foreground">{t("managePreferences")}</p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle>{t("appearance")}</CardTitle>
            <CardDescription>{t("customizeAppearance")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{t("theme")}</Label>
              <div className="flex gap-2">
                {[
                  { value: "light", label: t("light"), icon: Sun },
                  { value: "dark", label: t("dark"), icon: Moon },
                  { value: "system", label: t("system"), icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={theme === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleThemeChange(value)}
                    className={cn("gap-2", theme !== value && "bg-transparent")}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("language")}</Label>
              <Select
                value={language}
                onValueChange={(v) => {
                  if (v !== language) {
                    handleLanguageChange(v as Language);
                  }
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("english")}</SelectItem>
                  <SelectItem value="es">{t("spanish")}</SelectItem>
                  <SelectItem value="ja">{t("japanese")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Card Transparency */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("transparentCards")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("transparentCardsDescription")}
                </p>
              </div>
              <Switch
                checked={userDoc?.preferences.cardTransparency ?? false}
                onCheckedChange={handleCardTransparencyChange}
              />
            </div>

            <Separator />

            {/* Custom Background */}
            <div className="space-y-4">
              <div>
                <Label className="text-base">{t("customBackground")}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("customBackgroundDescription")}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enable-bg">{t("enableCustomBackground")}</Label>
                <Switch
                  id="enable-bg"
                  checked={enableCustomBg}
                  onCheckedChange={handleEnableCustomBgChange}                />
              </div>

              {enableCustomBg && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="bg-url">{t("backgroundImageUrl")}</Label>
                    <Input
                      id="bg-url"
                      type="url"
                      value={customBackgroundUrl}
                      onChange={(e) => setCustomBackgroundUrl(e.target.value)}
                      placeholder={t("backgroundImageUrlPlaceholder")}
                    />
                  </div>

                  {customBackgroundUrl && (
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div
                        className="h-24 rounded-lg border bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${customBackgroundUrl})`,
                        }}
                      />
                    </div>
                  )}

                  <Button
                    size="sm"
                    onClick={handleSaveCustomBackground}
                    disabled={isSavingBackground}
                    className="gap-2"
                  >
                    {isSavingBackground ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {t("saving")}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {t("saveChanges")}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle>{t("categories")}</CardTitle>
            <CardDescription>
              {t("organizeByCategoryDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingCategoryId ? (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <Label>Edit Category</Label>
                <Input
                  value={editingCategoryName}
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                  placeholder={t("categoryName")}
                />
                <div className="flex gap-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "h-6 w-6 rounded-full transition-all",
                        editingCategoryColor === color && "ring-2 ring-offset-2 ring-primary",
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditingCategoryColor(color)}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEditCategory} className="gap-2">
                    <Check className="h-4 w-4" />
                    {t("save")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingCategoryId(null)}>
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                onDragStart={() => setIsDraggingCategories(true)}
                onDragCancel={() => setIsDraggingCategories(false)}
                onDragEnd={handleCategoryDragEnd}
              >
                <SortableContext
                  items={orderedCategories.map((category) => category.id)}
                  strategy={rectSortingStrategy}
                >
                  <div
                    className={cn(
                      "flex flex-wrap gap-2 rounded-lg border-2 border-dashed p-2 transition-colors",
                      isDraggingCategories ? "border-primary/70 bg-primary/5" : "border-transparent",
                    )}
                  >
                    {orderedCategories.map((category) => (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        onEdit={handleStartEditCategory}
                        onDelete={deleteCategory}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <div className="flex items-center gap-3">
              <Input
                placeholder={t("newCategoryPlaceholder")}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <div className="flex gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-6 w-6 rounded-full transition-all",
                      newCategoryColor === color && "ring-2 ring-offset-2 ring-primary",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCategoryColor(color)}
                  />
                ))}
              </div>
              <Button size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle>{t("projects")}</CardTitle>
            <CardDescription>{t("groupRelatedDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingProjectId ? (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <Label>Edit Project</Label>
                <Input
                  value={editingProjectName}
                  onChange={(e) => setEditingProjectName(e.target.value)}
                  placeholder={t("projectName")}
                />
                <div className="flex gap-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "h-6 w-6 rounded-full transition-all",
                        editingProjectColor === color && "ring-2 ring-offset-2 ring-primary",
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditingProjectColor(color)}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEditProject} className="gap-2">
                    <Check className="h-4 w-4" />
                    {t("save")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingProjectId(null)}>
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                onDragStart={() => setIsDraggingProjects(true)}
                onDragCancel={() => setIsDraggingProjects(false)}
                onDragEnd={handleProjectDragEnd}
              >
                <SortableContext
                  items={orderedProjects.map((project) => project.id)}
                  strategy={rectSortingStrategy}
                >
                  <div
                    className={cn(
                      "flex flex-wrap gap-2 rounded-lg border-2 border-dashed p-2 transition-colors",
                      isDraggingProjects ? "border-primary/70 bg-primary/5" : "border-transparent",
                    )}
                  >
                    {orderedProjects.map((project) => (
                      <SortableProjectItem
                        key={project.id}
                        project={project}
                        onEdit={handleStartEditProject}
                        onDelete={deleteProject}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <div className="flex items-center gap-3">
              <Input
                placeholder={t("newProjectPlaceholder")}
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleAddProject()}
              />
              <div className="flex gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-6 w-6 rounded-full transition-all",
                      newProjectColor === color && "ring-2 ring-offset-2 ring-primary",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewProjectColor(color)}
                  />
                ))}
              </div>
              <Button size="sm" onClick={handleAddProject} disabled={!newProjectName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pomodoro Settings */}
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle>{t("pomodoroSettings")}</CardTitle>
            <CardDescription>{t("configureTimers")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="pomodoro-duration">{t("focusDuration")}</Label>
                <Input
                  id="pomodoro-duration"
                  type="number"
                  value={settings.pomodoroDuration || 25}
                  onChange={(e) =>
                    updateSettings({
                      pomodoroDuration: Number.parseInt(e.target.value) || 25,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="short-break">{t("shortBreakDuration")}</Label>
                <Input
                  id="short-break"
                  type="number"
                  value={settings.shortBreakDuration || 5}
                  onChange={(e) =>
                    updateSettings({
                      shortBreakDuration: Number.parseInt(e.target.value) || 5,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="long-break">{t("longBreakDuration")}</Label>
                <Input
                  id="long-break"
                  type="number"
                  value={settings.longBreakDuration || 15}
                  onChange={(e) =>
                    updateSettings({
                      longBreakDuration: Number.parseInt(e.target.value) || 15,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("autoStartBreaks")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("autoStartBreaksDescription")}
                </p>
              </div>
              <Switch
                checked={settings.autoStartBreaks || false}
                onCheckedChange={(checked) =>
                  updateSettings({ autoStartBreaks: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle>{t("notifications")}</CardTitle>
            <CardDescription>{t("configureNotifications")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("browserNotifications")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("browserNotificationsDescription")}
                </p>
              </div>
              <Switch
                checked={settings.notifications || false}
                onCheckedChange={(checked) =>
                  updateSettings({ notifications: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {language === "es" ? "Facturación" : "Billing"}
            </CardTitle>
            <CardDescription>
              {language === "es" ? "Gestiona tu plan y suscripción" : "Manage your plan and subscription"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan */}
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-base">
                    {isPro
                      ? language === "es"
                        ? "Plan Individual"
                        : "Individual Plan"
                      : language === "es"
                        ? "Plan Gratuito"
                        : "Free Plan"}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {isPro
                      ? language === "es"
                        ? "Acceso completo a todas la características PRO"
                        : "Full access to all PRO features"
                      : language === "es"
                        ? "Plan básico con funcionalidades limitadas"
                        : "Basic plan with limited features"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {isPro ? (
                      <span className="text-green-600 dark:text-green-400">
                        {language === "es" ? "Inactivo" : "Inactive"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {language === "es" ? "Activo" : "Active"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Comparison */}
            {!isPro && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="text-sm font-semibold">
                    {language === "es" ? "Características PRO" : "PRO Features"}
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{language === "es" ? "Categorías y proyectos ilimitados" : "Unlimited categories and projects"}</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{language === "es" ? "Análisis avanzados y reportes" : "Advanced analytics and reports"}</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{language === "es" ? "Calendario de metas integrado" : "Integrated goals calendar"}</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{language === "es" ? "Soporte prioritario" : "Priority support"}</span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {/* Coming Soon Message */}
            <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900 dark:text-amber-200">
                  <div className="font-semibold mb-1">
                    {language === "es" ? "Integración de pagos en desarrollo" : "Payment integration coming soon"}
                  </div>
                  <p className="text-amber-800 dark:text-amber-300">
                    {language === "es"
                      ? "Estamos trabajando en la integración segura con Stripe. Los pagos estarán disponibles cuando haya suficiente demanda e interés en la plataforma."
                      : "We're working on secure integration with Stripe. Payment processing will be available when there's sufficient demand and interest in the platform."}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {!isPro ? (
                <Button
                  className="flex-1"
                  disabled
                  title={
                    language === "es"
                      ? "Próximamente disponible"
                      : "Coming soon"
                  }
                >
                  {language === "es" ? "Mejorar a PRO" : "Upgrade to PRO"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled
                  title={
                    language === "es"
                      ? "Próximamente disponible"
                      : "Coming soon"
                  }
                >
                  {language === "es" ? "Cambiar plan" : "Change plan"}
                </Button>
              )}
              {isPro && (
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled
                  title={
                    language === "es"
                      ? "Próximamente disponible"
                      : "Coming soon"
                  }
                >
                  {language === "es" ? "Cancelar suscripción" : "Cancel subscription"}
                </Button>
              )}
            </div>

            {/* Info Text */}
            <p className="text-xs text-muted-foreground text-center">
              {language === "es"
                ? "Por favor, contacta con nosotros si tienes preguntas sobre tu suscripción."
                : "Please contact us if you have any questions about your subscription."}
            </p>
          </CardContent>
        </Card>


        {/* Danger Zone */}
        <Card className={cn(cardClassName, "border-destructive/60 bg-destructive/5")}>
          <CardHeader>
            <CardTitle className="text-destructive">
              {language === "es" ? "Eliminar cuenta" : "Delete account"}
            </CardTitle>
            <CardDescription>
              {language === "es"
                ? "Esta accion es irreversible. Se eliminaran todos tus datos de Firestore."
                : "This action is irreversible. It will remove all your Firestore data."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {language === "es"
                ? "Confirmacion requerida: al eliminar la cuenta tambien se borraran tareas, eventos, proyectos, categorias, metas, retos y notificaciones."
                : "Confirmation required: deleting your account also removes tasks, events, projects, categories, goals, challenges, and notifications."}
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeletingAccount}>
                  {isDeletingAccount
                    ? language === "es"
                      ? "Eliminando..."
                      : "Deleting..."
                    : language === "es"
                      ? "Eliminar cuenta y datos"
                      : "Delete account and data"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {language === "es" ? "Confirmar eliminacion" : "Confirm deletion"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {language === "es"
                      ? "Esta accion no se puede deshacer. Se eliminara tu cuenta y todos tus registros."
                      : "This action cannot be undone. Your account and all records will be deleted."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {language === "es" ? "Cancelar" : "Cancel"}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                  >
                    {language === "es" ? "Si, eliminar" : "Yes, delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
      </PageTransition>
  );
}
