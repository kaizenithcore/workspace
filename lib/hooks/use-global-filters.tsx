"use client"

import * as React from "react"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"

interface GlobalFiltersContextValue {
  selectedProjectId: string | null
  selectedCategoryId: string | null
  setSelectedProjectId: (id: string | null) => void
  setSelectedCategoryId: (id: string | null) => void
}

const GlobalFiltersContext = React.createContext<GlobalFiltersContextValue | undefined>(undefined)

export function GlobalFiltersProvider({ children }: { children: React.ReactNode }) {
  const [selectedProjectId, setSelectedProjectId] = useLocalStorage<string | null>("focusflow-selected-project", null)
  const [selectedCategoryId, setSelectedCategoryId] = useLocalStorage<string | null>(
    "focusflow-selected-category",
    null,
  )

  const value = React.useMemo(
    () => ({
      selectedProjectId,
      selectedCategoryId,
      setSelectedProjectId,
      setSelectedCategoryId,
    }),
    [selectedProjectId, selectedCategoryId, setSelectedProjectId, setSelectedCategoryId],
  )

  return <GlobalFiltersContext.Provider value={value}>{children}</GlobalFiltersContext.Provider>
}

export function useGlobalFilters() {
  const context = React.useContext(GlobalFiltersContext)
  if (!context) {
    throw new Error("useGlobalFilters must be used within a GlobalFiltersProvider")
  }
  return context
}
