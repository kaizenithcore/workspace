"use client"
import { TimeTracker } from "@/components/tracker/time-tracker"
import { PageTransition } from "@/components/ui/page-transition"
import { ProBanner } from "@/components/ui/pro-banner"
import { useDataStore } from "@/lib/hooks/use-data-store"
import { useGlobalFilters } from "@/lib/hooks/use-global-filters"
import { useGlobalTimer } from "@/lib/hooks/use-global-timer"
import { useI18n } from "@/lib/hooks/use-i18n"
import React from "react"
import type { TimeEntry } from "@/lib/types"

export default function TrackerPage() {
  const { t } = useI18n()
  const { selectedProjectId, selectedCategoryId } = useGlobalFilters()
  const { timeEntries, categories, projects, addTimeEntry, updateTimeEntry, deleteTimeEntry } = useDataStore()
  const globalTimer = useGlobalTimer()

  const filteredEntries = React.useMemo(() => {
    return timeEntries.filter((entry) => {
      const projectMatch = !selectedProjectId || (entry.projectIds && entry.projectIds.includes(selectedProjectId))
      const categoryMatch = !selectedCategoryId || (entry.categoryIds && entry.categoryIds.includes(selectedCategoryId))
      return projectMatch && categoryMatch
    })
  }, [timeEntries, selectedProjectId, selectedCategoryId])

  const handleEntryCreate = (entry: Omit<TimeEntry, "id" | "userId" | "createdAt" | "updatedAt">) => {
    addTimeEntry(entry)
  }

  const handleEntryUpdate = (updatedEntry: TimeEntry) => {
    updateTimeEntry(updatedEntry.id, updatedEntry)
  }

  const handleEntryDelete = (entryId: string) => {
    deleteTimeEntry(entryId)
  }

  return (
    <PageTransition>
      <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("tracker")}</h1>
        <p className="text-muted-foreground">{t("trackTimeDescription")}</p>
      </div>

      <TimeTracker
        entries={filteredEntries}
        categories={categories}
        projects={projects}
        globalTimer={globalTimer}
        onEntryCreate={handleEntryCreate}
        onEntryUpdate={handleEntryUpdate}
        onEntryDelete={handleEntryDelete}
      />

      <div className="mt-6">
        <ProBanner feature="Unlimited export history" onUpgrade={() => {}} />
      </div>
      </div>
    </PageTransition>
  )
}
