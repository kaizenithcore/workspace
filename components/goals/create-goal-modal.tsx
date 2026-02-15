"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/lib/hooks/use-i18n"
import type { Goal, GoalType, GoalUnit, GoalAutoCalcSource, Category, Project } from "@/lib/types"

interface CreateGoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories?: Category[]
  projects?: Project[]
  onCreateGoal?: (goalData: Omit<Goal, "id" | "userId" | "createdAt" | "updatedAt" | "ownerId">) => Promise<void>
  loading?: boolean
}

export function CreateGoalModal({
  open,
  onOpenChange,
  categories = [],
  projects = [],
  onCreateGoal,
  loading = false,
}: CreateGoalModalProps) {
  const { t } = useI18n()
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [type, setType] = React.useState<GoalType>("count")
  const [target, setTarget] = React.useState("")
  const [unit, setUnit] = React.useState<GoalUnit>("tasks")
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = React.useState<string[]>([])
  const [autoCalcSource, setAutoCalcSource] = React.useState<GoalAutoCalcSource>("tasks")
  const [dueDate, setDueDate] = React.useState("")
  const [includeInChallenges, setIncludeInChallenges] = React.useState(true)
  const [notifyOnCompletion, setNotifyOnCompletion] = React.useState(true)

  const unitOptionsByType: Record<GoalType, GoalUnit[]> = {
    count: ["tasks", "pomodoros"],
    time: ["minutes", "hours", "seconds"],
    streak: ["days"],
    metric: ["tasks", "percent"],
    milestone: ["percent"],
  }

  const autoCalcOptionsByType: Record<GoalType, GoalAutoCalcSource[]> = {
    count: ["tasks", "manual"],
    time: ["time_entries", "manual"],
    streak: ["tasks", "manual"],
    metric: ["tasks", "time_entries", "pomodoro_sessions", "manual"],
    milestone: ["manual"],
  }

  const unitLabel = (value: GoalUnit) => {
    switch (value) {
      case "tasks":
        return t("goals.units.tasks")
      case "pomodoros":
        return t("goals.units.pomodoros")
      case "minutes":
        return t("goals.units.minutes")
      case "hours":
        return t("goals.units.hours")
      case "seconds":
        return t("goals.units.seconds")
      case "days":
        return t("goals.units.days")
      case "percent":
        return t("goals.units.percent")
      default:
        return value
    }
  }

  const handleCreate = async () => {
    if (!title.trim() || !target.trim()) {
      alert(t("fillRequiredFields"))
      return
    }

    const goalData: Omit<Goal, "id" | "userId" | "createdAt" | "updatedAt" | "ownerId"> = {
      title: title.trim(),
      description: description.trim() || null,
      type,
      target: parseInt(target, 10),
      current: 0,
      unit,
      categoryIds: selectedCategories.length > 0 ? selectedCategories : null,
      projectIds: selectedProjects.length > 0 ? selectedProjects : null,
      autoCalcSource,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00`) : null,
      includeInChallenges,
      status: "active",
    }

    await onCreateGoal?.(goalData)

    // Reset form
    setTitle("")
    setDescription("")
    setType("count")
    setTarget("")
    setUnit("tasks")
    setSelectedCategories([])
    setSelectedProjects([])
    setAutoCalcSource("tasks")
    setDueDate("")
    setIncludeInChallenges(true)
    setNotifyOnCompletion(true)

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("goals.new")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="goal-title">{t("title")} *</Label>
            <Input
              id="goal-title"
              placeholder={t("goals.titlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-description">{t("description")} ({t("optional")})</Label>
            <Textarea
              id="goal-description"
              placeholder={t("goals.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-type">{t("goals.type")}</Label>
              <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
                <SelectTrigger id="goal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">{t("goals.countBased")}</SelectItem>
                  <SelectItem value="time">{t("goals.timeBased")}</SelectItem>
                  <SelectItem value="streak">{t("goals.streakBased")}</SelectItem>
                  <SelectItem value="metric">{t("goals.metric")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-unit">{t("goals.unit")}</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as GoalUnit)}>
                <SelectTrigger id="goal-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitOptionsByType[type]?.map((u) => (
                    <SelectItem key={u} value={u}>
                        {unitLabel(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-target">{t("goals.target")} *</Label>
            <Input
              id="goal-target"
              type="number"
              placeholder={t("goals.targetPlaceholder")}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-calc">{t("goals.autoCalcSource")}</Label>
            <Select value={autoCalcSource} onValueChange={(v) => setAutoCalcSource(v as GoalAutoCalcSource)}>
              <SelectTrigger id="goal-calc">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {autoCalcOptionsByType[type]?.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source === "tasks"
                      ? t("goals.tasks")
                      : source === "time_entries"
                        ? t("goals.timeEntries")
                        : source === "pomodoro_sessions"
                          ? t("goals.pomodoroSessions")
                          : t("goals.manual")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-categories">{t("categories")} ({t("optional")})</Label>
            <MultiSelect
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              selected={selectedCategories}
              onChange={setSelectedCategories}
              placeholder={t("goals.selectCategories")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-projects">{t("projects")} ({t("optional")})</Label>
            <MultiSelect
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
              selected={selectedProjects}
              onChange={setSelectedProjects}
              placeholder={t("goals.selectProjects")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-due">{t("goals.duDate")} ({t("optional")})</Label>
            <Input
              id="goal-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="goal-challenges">{t("goals.includeChallenges")}</Label>
              <Switch
                id="goal-challenges"
                checked={includeInChallenges}
                onCheckedChange={setIncludeInChallenges}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="goal-notify">{t("goals.notifyCompletion")}</Label>
              <Switch
                id="goal-notify"
                checked={notifyOnCompletion}
                onCheckedChange={setNotifyOnCompletion}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? t("creating") : t("goals.createGoal")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
