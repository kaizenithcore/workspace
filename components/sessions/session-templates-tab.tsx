"use client"

import * as React from "react"
import { Plus, Edit2, Trash2, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useUser } from "@/lib/firebase/hooks"
import { createSessionTemplate, deleteSessionTemplate, updateSessionTemplate } from "@/lib/firestore-sessions"
import { useUserPlan } from "@/hooks/use-user-plan"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { SessionTemplate, Category, Project, Task, Goal } from "@/lib/types"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"

interface SessionTemplatesTabProps {
  templates: SessionTemplate[]
  categories: Category[]
  projects: Project[]
  tasks: Task[]
  goals: Goal[]
  onCreateFromTemplate?: (templateId: string, overrides?: any) => Promise<void>
  onEditTemplate?: (template: SessionTemplate) => void
}

export function SessionTemplatesTab({
  templates,
  categories,
  projects,
  tasks,
  goals,
  onCreateFromTemplate,
  onEditTemplate,
}: SessionTemplatesTabProps) {
  const { t } = useI18n()
  const { user } = useUser()
  const { isPro } = useUserPlan()
  const { toast } = useToast()
  const { cardClassName } = useCardTransparency()

  const templateLimit = isPro ? Infinity : 1
  const canCreateTemplate = templates.length < templateLimit

  const exampleTemplates = [
    {
      title: t("sessions.templateDaily") || "Daily Focus",
      description: t("sessions.templateDailyDesc") || "Plan rápido para comenzar cada día",
      estimatedDuration: 50,
      defaultTaskIds: [],
      defaultGoalIds: [],
      projectId: null,
      categoryId: null,
      pomodoroEnabled: true,
    },
    {
      title: t("sessions.templateSprint") || "Sprint Review",
      description: t("sessions.templateSprintDesc") || "Cierre semanal con tareas clave",
      estimatedDuration: 75,
      defaultTaskIds: [],
      defaultGoalIds: [],
      projectId: null,
      categoryId: null,
      pomodoroEnabled: false,
    },
    {
      title: t("sessions.templateDeepWork") || "Deep Work",
      description: t("sessions.templateDeepWorkDesc") || "Bloque largo sin distracciones",
      estimatedDuration: 90,
      defaultTaskIds: [],
      defaultGoalIds: [],
      projectId: null,
      categoryId: null,
      pomodoroEnabled: true,
    },
  ]

  const handleCreateExamples = async () => {
    if (!user?.uid) return

    const templatesToCreate = isPro ? exampleTemplates : exampleTemplates.slice(0, 1)

    try {
      for (const template of templatesToCreate) {
        await createSessionTemplate(user.uid, template)
      }

      toast({
        title: t("sessions.examplesAdded") || "Plantillas listas",
        description: isPro
          ? t("sessions.examplesAddedDesc") || "Se agregaron plantillas de ejemplo."
          : t("sessions.examplesAddedFree") || "Se agrego 1 plantilla gratuita."
      })

      if (!isPro) {
        toast({
          title: t("proFeature") || "Pro",
          description: t("sessions.templatesLimitUpsell") || "Desbloquea plantillas ilimitadas con Pro.",
        })
      }
    } catch (error) {
      console.error("Failed to create example templates", error)
      toast({
        title: t("error") || "Error",
        description: t("sessions.examplesFailed") || "No se pudieron crear las plantillas de ejemplo.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!user?.uid) return

    if (!confirm(t("sessions.confirmDeleteTemplate") || "Delete this template?")) {
      return
    }

    try {
      await deleteSessionTemplate(user.uid, templateId)
      toast({
        title: t("success") || "Success",
        description: t("sessions.templateDeleted") || "Template deleted",
      })
    } catch (error) {
      console.error("Failed to delete template", error)
    }
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-4">
          {t("sessions.noTemplates") || "No templates yet"}
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {t("sessions.templatesDescription") || "Create templates to quickly start new sessions"}
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button onClick={handleCreateExamples}>
            <Sparkles className="h-4 w-4 mr-2" />
            {t("sessions.addExamples") || "Add example templates"}
          </Button>
          <Button variant="outline" disabled={!canCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            {t("sessions.newTemplate") || "New Template"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => {
        const project = template.projectId
          ? projects.find((p) => p.id === template.projectId)
          : null
        const category = template.categoryId
          ? categories.find((c) => c.id === template.categoryId)
          : null
        const linkedTasksCount = template.defaultTaskIds.length
        const linkedGoalsCount = template.defaultGoalIds.length

        return (
          <Card
            key={template.id}
            className={`border-border/40 bg-card/50 backdrop-blur-sm transition-all hover:shadow-md hover:scale-[1.01] ${cardClassName}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base line-clamp-2">{template.title}</CardTitle>
                  {template.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {template.description}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      •••
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEditTemplate && (
                      <DropdownMenuItem onClick={() => onEditTemplate(template)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        {t("edit") || "Edit"}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDeleteTemplate(template.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("delete") || "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Meta Info */}
              <div className="flex items-center gap-2 flex-wrap">
                {project && (
                  <Badge variant="secondary" className="text-xs">
                    {project.name}
                  </Badge>
                )}
                {category && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                    title={category.name}
                  />
                )}
                <Badge variant="outline" className="text-xs">
                  {template.estimatedDuration} {t("sessions.minutes") || "min"}
                </Badge>
                {template.pomodoroEnabled && (
                  <Badge variant="outline" className="text-xs">
                    🍅 {t("sessions.pomodoro") || "Pomodoro"}
                  </Badge>
                )}
              </div>

              {/* Linked Items Summary */}
              <div className="space-y-1 text-xs text-muted-foreground">
                {linkedTasksCount > 0 && (
                  <div>
                    {linkedTasksCount} {t("sessions.tasks") || "tasks"}
                  </div>
                )}
                {linkedGoalsCount > 0 && (
                  <div>
                    {linkedGoalsCount} {t("sessions.objectives") || "objectives"}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Button
                onClick={() => onCreateFromTemplate?.(template.id)}
                className="w-full mt-2"
                size="sm"
              >
                {t("sessions.useTemplate") || "Use Template"}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
