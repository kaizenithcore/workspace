"use client"

import * as React from "react"
import { CalendarGrid } from "@/components/calendar/calendar-grid"
import { QuickAddModal } from "@/components/modals/quick-add-modal"
import { EventModal } from "@/components/modals/event-modal"
import { useDataStore } from "@/lib/hooks/use-data-store"
import { useGlobalFilters } from "@/lib/hooks/use-global-filters"
import { useI18n } from "@/lib/hooks/use-i18n"
import type { CalendarView, CalendarEvent } from "@/lib/types"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"

export default function AgendaPage() {
  const { t } = useI18n()
  const { selectedProjectId, selectedCategoryId } = useGlobalFilters()
  const { events, categories, projects, addEvent, updateEvent, deleteEvent, getCategoryById } = useDataStore()
  const [view, setView] = React.useState<CalendarView>("week")
  const [quickAddOpen, setQuickAddOpen] = React.useState(false)
  const [eventModalOpen, setEventModalOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const { cardClassName } = useCardTransparency();

  const filteredEvents = React.useMemo(() => {
    return events.filter((event) => {
      const projectMatch = !selectedProjectId || (event.projectIds && event.projectIds.includes(selectedProjectId))
      const categoryMatch = !selectedCategoryId || (event.categoryIds && event.categoryIds.includes(selectedCategoryId))
      return projectMatch && categoryMatch
    })
  }, [events, selectedProjectId, selectedCategoryId])

  const handleAddEvent = (date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    setEventModalOpen(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setEventModalOpen(true)
  }

  const handleEventDrop = (eventId: string, newStart: Date, newEnd: Date) => {
    updateEvent(eventId, { startTime: newStart, endTime: newEnd })
  }

  const handleSaveEvent = (eventData: Partial<CalendarEvent>) => {
    let eventColor = eventData.color
    if (!eventColor && eventData.categoryIds && eventData.categoryIds.length > 0) {
      const category = getCategoryById(eventData.categoryIds[0])
      if (category) {
        eventColor = category.color
      }
    }

    if (selectedEvent) {
      updateEvent(selectedEvent.id, { ...eventData, color: eventColor })
    } else {
      addEvent({
        title: eventData.title || "New Event",
        startTime: eventData.startTime || selectedDate || new Date(),
        endTime: eventData.endTime || new Date((selectedDate || new Date()).getTime() + 3600000),
        allDay: eventData.allDay ?? false,
        ...(eventColor && { color: eventColor }),
        categoryIds: selectedCategoryId ? [selectedCategoryId] : (eventData.categoryIds || []),
        ...(eventData.projectIds && eventData.projectIds.length > 0
          ? { projectIds: eventData.projectIds }
          : selectedProjectId
            ? { projectIds: [selectedProjectId] }
            : {}),
        ...(eventData.description && { description: eventData.description }),
      })
    }
    setEventModalOpen(false)
    setSelectedEvent(null)
  }

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      deleteEvent(selectedEvent.id)
      setEventModalOpen(false)
      setSelectedEvent(null)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-shrink-0 p-6 pb-0 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("agenda")}</h1>
            <p className="text-muted-foreground">{t("manageYourSchedule")}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6 pt-2 lg:px-8">
        <CalendarGrid
          view={view}
          onViewChange={setView}
          events={filteredEvents}
          categories={categories}
          projects={projects}
          onAddEvent={handleAddEvent}
          onEventClick={handleEventClick}
          onEventDrop={handleEventDrop}
          className="h-full"
          fullHeight
        />
      </div>

      <QuickAddModal open={quickAddOpen} onOpenChange={setQuickAddOpen} defaultType="event" />

      <EventModal
        open={eventModalOpen}
        onOpenChange={setEventModalOpen}
        event={selectedEvent}
        defaultDate={selectedDate}
        categories={categories}
        projects={projects}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? handleDeleteEvent : undefined}
      />
    </div>
  )
}
