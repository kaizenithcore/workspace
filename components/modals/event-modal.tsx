"use client"

import * as React from "react"
import { CalendarIcon, Clock, Trash2, Archive, RotateCcw } from "lucide-react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useI18n } from "@/lib/hooks/use-i18n"
import type { CalendarEvent, Category, Project } from "@/lib/types"
import { cn } from "@/lib/utils"

interface EventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: CalendarEvent | null
  defaultDate?: Date | null
  categories: Category[]
  projects: Project[]
  onSave: (event: Partial<CalendarEvent>) => void
  onDelete?: () => void
}

export function EventModal({
  open,
  onOpenChange,
  event,
  defaultDate,
  categories,
  projects,
  onSave,
  onDelete,
}: EventModalProps) {
  const { t } = useI18n()
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [startDate, setStartDate] = React.useState<Date>(new Date())
  const [endDate, setEndDate] = React.useState<Date>(new Date())
  const [startTime, setStartTime] = React.useState("09:00")
  const [endTime, setEndTime] = React.useState("10:00")
  const [allDay, setAllDay] = React.useState(false)
  const [completed, setCompleted] = React.useState(false)
  const [archived, setArchived] = React.useState(false)
  const [categoryId, setCategoryId] = React.useState<string>("")
  const [projectId, setProjectId] = React.useState<string>("")
  const [color, setColor] = React.useState("#3B82F6")

  React.useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description || "")
      setStartDate(new Date(event.startTime))
      setEndDate(new Date(event.endTime))
      setStartTime(format(new Date(event.startTime), "HH:mm"))
      setEndTime(format(new Date(event.endTime), "HH:mm"))
      setAllDay(event.allDay)
      setCompleted(!!event.completed)
      setArchived(!!event.archived)
      setCategoryId(event.categoryIds?.[0] || "")
      setProjectId(event.projectIds?.[0] || "")
      setColor(event.color || "#3B82F6")
    } else if (defaultDate) {
      setTitle("")
      setDescription("")
      setStartDate(defaultDate)
      setEndDate(defaultDate)
      setStartTime(format(defaultDate, "HH:mm"))
      setEndTime(format(new Date(defaultDate.getTime() + 3600000), "HH:mm"))
      setAllDay(false)
      setCompleted(false)
      setArchived(false)
      setCategoryId("")
      setProjectId("")
      setColor("#3B82F6")
    }
  }, [event, defaultDate, open])

  const handleSave = () => {
    const [startHour, startMin] = startTime.split(":").map(Number)
    const [endHour, endMin] = endTime.split(":").map(Number)

    const finalStartDate = new Date(startDate)
    finalStartDate.setHours(startHour, startMin, 0, 0)

    const finalEndDate = new Date(endDate)
    finalEndDate.setHours(endHour, endMin, 0, 0)

    onSave({
      title,
      ...(description.trim() && { description: description.trim() }),
      startTime: finalStartDate,
      endTime: finalEndDate,
      allDay,
      completed,
      categoryIds: categoryId && categoryId !== "none" ? [categoryId] : [],
      ...(projectId && projectId !== "none" && { projectIds: [projectId] }),
      color,
    })
  }

  const handleArchiveToggle = () => {
    onSave({ archived: !archived })
    onOpenChange(false)
  }

  const colors = ["#3B82F6", "#10B981", "#FF6B35", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444", "#06B6D4"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{event ? t("editEvent") : t("newEvent")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("eventTitle")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("eventTitlePlaceholder")}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("eventDescriptionPlaceholder")}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allDay">{t("allDay")}</Label>
            <Switch id="allDay" checked={allDay} onCheckedChange={setAllDay} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="completed">{t("completed")}</Label>
            <Switch id="completed" checked={completed} onCheckedChange={setCompleted} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("startDate")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="space-y-2">
                <Label>{t("startTime")}</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("endDate")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="space-y-2">
                <Label>{t("endTime")}</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1" />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("category")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noCategory")}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("project")}</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectProject")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noProject")}</SelectItem>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: proj.color }} />
                        {proj.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("color")}</Label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "h-6 w-6 rounded-full transition-all",
                    color === c && "ring-2 ring-offset-2 ring-primary",
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          {onDelete && (
            <Button variant="destructive" onClick={onDelete} className="sm:mr-auto">
              <Trash2 className="mr-2 h-4 w-4" />
              {t("delete")}
            </Button>
          )}
          {event && (
            <Button variant="outline" onClick={handleArchiveToggle}>
              {archived ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t("unarchive")}
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  {t("archive")}
                </>
              )}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {event ? t("save") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
