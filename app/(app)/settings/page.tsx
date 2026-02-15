"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor, Plus, Trash2, Check, Edit2, GripVertical } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAppSettings } from "@/lib/hooks/use-app-settings"
import { useDataStore } from "@/lib/hooks/use-data-store"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useUser } from "@/lib/firebase/hooks"
import { useUserDocument } from "@/lib/hooks/use-user-document"
import { updateUserPreferences } from "@/lib/firestore-user"
import { cn } from "@/lib/utils"
import type { Language } from "@/lib/i18n/translations"
import { useToast } from "@/hooks/use-toast"
import { Category, Project } from "@/lib/types" // Import Category and Project types
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"
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
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useAppSettings()
  const { categories, projects, addCategory, addProject, deleteCategory, deleteProject, updateCategory, updateProject } = useDataStore()
  const { t, language, setLanguage } = useI18n()
  const { user } = useUser()
  const { userDoc } = useUserDocument(user?.uid)
  const { toast } = useToast()


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


  const isPro =
    userDoc?.subscription.plan === "individual" &&
    userDoc?.subscription.status === "active";

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
            <CardTitle>{t("billing")}</CardTitle>
            <CardDescription>{t("manageSubscription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {isPro
                      ? userDoc?.preferences.language === "es"
                        ? "Plan Individual"
                        : "Individual Plan"
                      : userDoc?.preferences.language === "es"
                        ? "Plan Gratuito"
                        : "Free Plan"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isPro
                      ? userDoc?.preferences.language === "es"
                        ? "Activo"
                        : "Active"
                      : t("basicFeaturesIncluded")}
                  </div>
                </div>
                {!isPro && <Button>{t("upgradeToPro")}</Button>}
              </div>
            </div>

            {!isPro && (
              <>
                <Separator />

                <div className="text-sm text-muted-foreground">
                  <p>{t("proIncludes")}</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>{t("proFeatureExport")}</li>
                    <li>{t("proFeatureAnalytics")}</li>
                    <li>{t("proFeatureCalendar")}</li>
                    <li>{t("proFeatureSupport")}</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
