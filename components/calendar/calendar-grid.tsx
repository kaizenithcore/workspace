"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Plus, LayoutGrid, List, CalendarIcon, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "@/lib/hooks/use-i18n"
import type { CalendarView, CalendarEvent, Category, Project } from "@/lib/types"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"

interface CalendarGridProps {
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  events?: CalendarEvent[]
  categories?: Category[]
  projects?: Project[]
  onEventClick?: (event: CalendarEvent) => void
  onAddEvent?: (date: Date) => void
  onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void
  className?: string
  fullHeight?: boolean
}

const viewOptions: { value: CalendarView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "day", label: "Day", icon: List },
  { value: "week", label: "Week", icon: LayoutGrid },
  { value: "month", label: "Month", icon: CalendarIcon },
  { value: "year", label: "Year", icon: CalendarDays },
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function CalendarGrid({
  view,
  onViewChange,
  events = [],
  categories = [],
  projects = [],
  onEventClick,
  onAddEvent,
  onEventDrop,
  className,
  fullHeight = false,
}: CalendarGridProps) {
  const { t } = useI18n()
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [draggedEvent, setDraggedEvent] = React.useState<CalendarEvent | null>(null)
  const today = new Date()
    const { cardClassName } = useCardTransparency();


  const navigatePrev = () => {
    const newDate = new Date(currentDate)
    if (view === "day") newDate.setDate(newDate.getDate() - 1)
    else if (view === "week") newDate.setDate(newDate.getDate() - 7)
    else if (view === "year") newDate.setFullYear(newDate.getFullYear() - 1)
    else newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (view === "day") newDate.setDate(newDate.getDate() + 1)
    else if (view === "week") newDate.setDate(newDate.getDate() + 7)
    else if (view === "year") newDate.setFullYear(newDate.getFullYear() + 1)
    else newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const goToToday = () => setCurrentDate(new Date())

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.startTime), date))
  }

  const getEventColor = (event: CalendarEvent) => {
    if (event.color) return event.color
    if (event.categoryIds && event.categoryIds.length > 0) {
      const category = categories.find((c) => c.id === event.categoryIds![0])
      if (category) return category.color
    }
    if (event.projectIds) {
      const project = projects.find((p) => p.id === event.projectIds![0])
      if (project) return project.color
    }
    return "#3B82F6"
  }

  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    setDraggedEvent(event)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetDate: Date, targetHour?: number) => {
    e.preventDefault()
    if (!draggedEvent || !onEventDrop) return

    const originalStart = new Date(draggedEvent.startTime)
    const originalEnd = new Date(draggedEvent.endTime)
    const duration = originalEnd.getTime() - originalStart.getTime()

    const newStart = new Date(targetDate)
    if (targetHour !== undefined) {
      newStart.setHours(targetHour, 0, 0, 0)
    } else {
      newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0)
    }
    const newEnd = new Date(newStart.getTime() + duration)

    onEventDrop(draggedEvent.id, newStart, newEnd)
    setDraggedEvent(null)
  }

  const renderYearView = () => {
    const year = currentDate.getFullYear()
    const months = Array.from({ length: 12 }, (_, i) => i)

    return (
      <div className={cn("grid grid-cols-3 md:grid-cols-4 gap-4", fullHeight && "h-full overflow-auto p-2")}>
        {months.map((month) => {
          const daysInMonth = getDaysInMonth(year, month)
          const firstDay = getFirstDayOfMonth(year, month)
          const monthDate = new Date(year, month, 1)
          const monthEvents = events.filter((e) => {
            const eventDate = new Date(e.startTime)
            return eventDate.getMonth() === month && eventDate.getFullYear() === year
          })

          return (
            <div key={month} className="border rounded-lg p-2">
              <div
                className="font-medium text-sm mb-2 cursor-pointer hover:text-primary"
                onClick={() => {
                  setCurrentDate(monthDate)
                  onViewChange("month")
                }}
              >
                {monthDate.toLocaleDateString("en-US", { month: "short" })}
              </div>
              <div className="grid grid-cols-7 gap-px text-[10px]">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="text-center text-muted-foreground">
                    {d}
                  </div>
                ))}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const date = new Date(year, month, day)
                  const isToday = isSameDay(date, today)
                  const dayEvents = getEventsForDay(date)
                  const hasEvents = dayEvents.length > 0

                  return (
                    <div
                      key={day}
                      className={cn(
                        "text-center py-0.5 cursor-pointer hover:bg-accent rounded-sm relative",
                        isToday && "bg-primary text-primary-foreground font-medium",
                      )}
                      onClick={() => {
                        setCurrentDate(date)
                        onViewChange("day")
                      }}
                    >
                      {day}
                      {hasEvents && !isToday && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </div>
                  )
                })}
              </div>
              {monthEvents.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">{monthEvents.length} events</div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const days: React.ReactNode[] = []
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
function getContrastColor(eventColor: string) {
                        // Simple contrast calculation (in a real app, you'd use a more robust method)
                        const hex = eventColor.replace("#", "")
                        const r = parseInt(hex.substring(0, 2), 16)
                        const g = parseInt(hex.substring(2, 4), 16)
                        const b = parseInt(hex.substring(4, 6), 16)
                        const brightness = (r * 299 + g * 587 + b * 114) / 1000
                        return brightness > 128 ? "#000000" : "#FFFFFF"
                      }
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="border-b border-r bg-muted/30 min-h-[80px]" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isToday = isSameDay(date, today)
      const dayEvents = getEventsForDay(date)

      days.push(
        <div
          key={day}
          className={cn(
            "border-b border-r p-1.5 transition-colors hover:bg-accent/50 cursor-pointer min-h-[80px] flex flex-col",
            isToday && "bg-primary/5",
          )}
          onClick={() => onAddEvent?.(date)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, date)}
        >
          <div className="flex items-center justify-between flex-shrink-0">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-sm",
                isToday && "bg-primary text-primary-foreground font-medium",
              )}
            >
              {day}
            </span>
          </div>
          <div className="mt-1 space-y-0.5 overflow-hidden flex-1">
            {dayEvents.slice(0, 3).map((event) => {
              const eventColor = getEventColor(event)
              return (
                <TooltipProvider key={event.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, event)}
                        className="truncate rounded px-1.5 py-0.5 text-xs cursor-grab hover:opacity-80 active:cursor-grabbing"
                          style={{ backgroundColor: `${eventColor}80`, color: getContrastColor(eventColor) }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick?.(event)
                        }}
                      >
                        {event.title}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground px-1">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>,
      )
    }

    for (let i = firstDay + daysInMonth; i < totalCells; i++) {
      days.push(<div key={`empty-end-${i}`} className="border-b border-r bg-muted/30 min-h-[80px]" />)
    }

    return (
      <div className={cn("border-l border-t rounded-lg overflow-hidden flex flex-col", fullHeight && "h-full")}>
        <div className="grid grid-cols-7 border-b bg-muted/50 flex-shrink-0">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="border-r py-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className={cn("grid grid-cols-7", fullHeight && "flex-1 auto-rows-fr")}>{days}</div>
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      return date
    })

    return (
      <div className={cn("border rounded-lg overflow-hidden flex flex-col", fullHeight && "h-full")}>
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/50 flex-shrink-0">
          <div className="border-r" />
          {weekDays.map((date, i) => (
            <div key={i} className={cn("border-r py-2 text-center", isSameDay(date, today) && "bg-primary/5")}>
              <div className="text-xs font-medium text-muted-foreground">
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className={cn("text-lg font-semibold", isSameDay(date, today) && "text-primary")}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className={cn("overflow-auto", fullHeight && "flex-1")}>
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
              <div className="border-r px-2 py-2 text-right text-xs text-muted-foreground">
                {hour.toString().padStart(2, "0")}:00
              </div>
              {weekDays.map((date, i) => {
                const hourEvents = events.filter((e) => {
                  const eventDate = new Date(e.startTime)
                  return isSameDay(eventDate, date) && eventDate.getHours() === hour
                })
                return (
                  <div
                    key={i}
                    className={cn(
                      "border-r min-h-[48px] hover:bg-accent/50 cursor-pointer transition-colors p-0.5",
                      isSameDay(date, today) && "bg-primary/5",
                    )}
                    onClick={() => {
                      const eventDate = new Date(date)
                      eventDate.setHours(hour)
                      onAddEvent?.(eventDate)
                    }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, date, hour)}
                  >
                    {hourEvents.map((event) => {
                      const eventColor = getEventColor(event)
                      function getContrastColor(eventColor: string) {
                        // Simple contrast calculation (in a real app, you'd use a more robust method)
                        const hex = eventColor.replace("#", "")
                        const r = parseInt(hex.substring(0, 2), 16)
                        const g = parseInt(hex.substring(2, 4), 16)
                        const b = parseInt(hex.substring(4, 6), 16)
                        const brightness = (r * 299 + g * 587 + b * 114) / 1000
                        return brightness > 128 ? "#000000" : "#FFFFFF"
                      }

                      return (
                        <div
                          key={event.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, event)}
                          className="rounded px-1 py-0.5 text-xs truncate cursor-grab hover:opacity-80 active:cursor-grabbing"
                          style={{ backgroundColor: `${eventColor}80`, color: getContrastColor(eventColor) }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventClick?.(event)
                          }}
                        >
                          {event.title}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = getEventsForDay(currentDate)
function getContrastColor(eventColor: string) {
                        // Simple contrast calculation (in a real app, you'd use a more robust method)
                        const hex = eventColor.replace("#", "")
                        const r = parseInt(hex.substring(0, 2), 16)
                        const g = parseInt(hex.substring(2, 4), 16)
                        const b = parseInt(hex.substring(4, 6), 16)
                        const brightness = (r * 299 + g * 587 + b * 114) / 1000
                        return brightness > 128 ? "#000000" : "#FFFFFF"
                      }
    return (
      <div className={cn("border rounded-lg overflow-hidden flex flex-col", fullHeight && "h-full")}>
        <div className={cn("overflow-auto", fullHeight && "flex-1")}>
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[60px_1fr] border-b">
              <div className="border-r px-2 py-3 text-right text-xs text-muted-foreground">
                {hour.toString().padStart(2, "0")}:00
              </div>
              <div
                className="min-h-[56px] hover:bg-accent/50 cursor-pointer transition-colors p-1"
                onClick={() => {
                  const eventDate = new Date(currentDate)
                  eventDate.setHours(hour)
                  onAddEvent?.(eventDate)
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, currentDate, hour)}
              >
                {dayEvents
                  .filter((e) => new Date(e.startTime).getHours() === hour)
                  .map((event) => {
                    const eventColor = getEventColor(event)
                    return (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, event)}
                        className="rounded px-2 py-1 text-sm mb-1 cursor-grab hover:opacity-80 active:cursor-grabbing"
                          style={{ backgroundColor: `${eventColor}80`, color: getContrastColor(eventColor) }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick?.(event)
                        }}
                      >
                        {event.title}
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-4", fullHeight && "h-full", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            {t("today")}
          </Button>
          <div className="flex items-center rounded-md border">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigatePrev} aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigateNext} aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold">
            {view === "day"
              ? currentDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : view === "year"
                ? currentDate.getFullYear().toString()
                : formatMonthYear(currentDate)}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border p-0.5">
            {viewOptions.map((option) => (
              <Button
                key={option.value}
                variant={view === option.value ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => onViewChange(option.value)}
              >
                <option.icon className="h-4 w-4" />
                <span className="ml-1.5 hidden sm:inline">{option.label}</span>
              </Button>
            ))}
          </div>

          <Button size="sm" className="gap-2" onClick={() => onAddEvent?.(currentDate)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("addEvent")}</span>
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      <div className={cn(fullHeight && "flex-1 overflow-hidden", cardClassName)}>
        {view === "year" && renderYearView()}
        {view === "month" && renderMonthView()}
        {view === "week" && renderWeekView()}
        {view === "day" && renderDayView()}
      </div>
    </div>
  )
}
