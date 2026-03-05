"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useUser } from "@/lib/firebase/hooks"
import { createSessionTemplate } from "@/lib/firestore-sessions"
import { useToast } from "@/hooks/use-toast"
import type { Category, Project } from "@/lib/types"

interface CreateTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories?: Category[]
  projects?: Project[]
  onSuccess?: () => void
}

export function CreateTemplateModal({
  open,
  onOpenChange,
  categories = [],
  projects = [],
  onSuccess,
}: CreateTemplateModalProps) {
  const { t } = useI18n()
  const { user } = useUser()
  const { toast } = useToast()

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [estimatedDuration, setEstimatedDuration] = React.useState("60")
  const [projectId, setProjectId] = React.useState<string | null>(null)
  const [categoryId, setCategoryId] = React.useState<string | null>(null)
  const [pomodoroEnabled, setPomodoroEnabled] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleCreate = async () => {
    if (!user?.uid) return
    if (!title.trim()) {
      toast({
        title: t("error") || "Error",
        description: t("sessions.templateTitleRequired") || "Template title is required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await createSessionTemplate(user.uid, {
        title: title.trim(),
        description: description.trim() || null,
        estimatedDuration: parseInt(estimatedDuration),
        projectId,
        categoryId,
        pomodoroEnabled,
        defaultTaskIds: [],
        defaultGoalIds: [],
      })

      toast({
        title: t("success") || "Success",
        description: t("sessions.templateCreated") || "Template created successfully",
      })

      // Reset form
      setTitle("")
      setDescription("")
      setEstimatedDuration("60")
      setProjectId(null)
      setCategoryId(null)
      setPomodoroEnabled(false)

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to create template", error)
      toast({
        title: t("error") || "Error",
        description: t("sessions.failedToCreateTemplate") || "Failed to create template",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("sessions.newTemplate") || "Create New Template"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="template-title">
              {t("title")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="template-title"
              placeholder={t("sessions.templateTitlePlaceholder") || "e.g., Evening Review"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="template-description">
              {t("description")} ({t("optional") || "optional"})
            </Label>
            <Textarea
              id="template-description"
              placeholder={t("sessions.templateDescPlaceholder") || "Describe this template..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="template-duration">
              {t("sessions.estimatedDuration")} {t("sessions.minutes")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="template-duration"
              type="number"
              placeholder="60"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              min="5"
              max="480"
            />
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label htmlFor="template-project">{t("project")} ({t("optional") || "optional"})</Label>
            <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? null : v)}>
              <SelectTrigger id="template-project">
                <SelectValue placeholder={t("selectProject") || "Select project..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("none") || "None"}</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="template-category">{t("category")} ({t("optional") || "optional"})</Label>
            <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? null : v)}>
              <SelectTrigger id="template-category">
                <SelectValue placeholder={t("selectCategory") || "Select category..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("none") || "None"}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pomodoro Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("sessions.pomodoroMode") || "Enable Pomodoro Mode"}</Label>
              <p className="text-xs text-muted-foreground">
                {t("sessions.pomodoroDescription") || "Track pomodoros in sessions using this template"}
              </p>
            </div>
            <Switch checked={pomodoroEnabled} onCheckedChange={setPomodoroEnabled} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel") || "Cancel"}
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? t("loading") || "Creating..." : t("create") || "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
