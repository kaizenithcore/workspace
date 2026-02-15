"use client"

import * as React from "react"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"

interface AppSettings {
  transparentCards: boolean
  backgroundImage: string | null
  pomodoroDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  autoStartBreaks: boolean
  notifications: boolean
  focusMode: boolean
}

interface AppSettingsContextValue {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  focusMode: boolean
  setFocusMode: (enabled: boolean) => void
}

const defaultSettings: AppSettings = {
  transparentCards: false,
  backgroundImage: null,
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  notifications: true,
  focusMode: false,
}

const AppSettingsContext = React.createContext<AppSettingsContextValue | undefined>(undefined)

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useLocalStorage<AppSettings>("focusflow-app-settings", defaultSettings)

  const updateSettings = React.useCallback(
    (updates: Partial<AppSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }))
    },
    [setSettings],
  )

  const value = React.useMemo(
    () => ({
      settings,
      updateSettings,
      focusMode: settings.focusMode,
      setFocusMode: (enabled: boolean) => updateSettings({ focusMode: enabled }),
    }),
    [settings, updateSettings],
  )

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}

export function useAppSettings() {
  const context = React.useContext(AppSettingsContext)
  if (!context) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider")
  }
  return context
}
