"use client"

import type * as React from "react"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { KeyboardShortcutsProvider } from "@/components/providers/keyboard-shortcuts-provider"
import { I18nProvider } from "@/lib/hooks/use-i18n"
import { AppSettingsProvider } from "@/lib/hooks/use-app-settings"
import { DataStoreProvider } from "@/lib/hooks/use-data-store"
import { GlobalFiltersProvider } from "@/lib/hooks/use-global-filters"
import { GlobalTimerProvider } from "@/lib/hooks/use-global-timer"
import { GlobalPomodoroProvider } from "@/lib/hooks/use-global-pomodoro"
import { LoadingOverlay } from "@/components/providers/loading-overlay"
import { FloatingTimer } from "@/components/tracker/floating-timer"
import { FloatingPomodoro } from "@/components/pomodoro/floating-pomodoro"
import { GoalEventsManager } from "@/components/goals/goal-events-manager"
import { Toaster } from "@/components/ui/toaster"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <I18nProvider>
        <AppSettingsProvider>
          <DataStoreProvider>
            <GlobalFiltersProvider>
              <GlobalTimerProvider>
                <GlobalPomodoroProvider>
                  <KeyboardShortcutsProvider>
                    <LoadingOverlay>
                      <GoalEventsManager />
                      {children}
                      <FloatingTimer />
                      <FloatingPomodoro />
                    </LoadingOverlay>
                    <Toaster />
                  </KeyboardShortcutsProvider>
                </GlobalPomodoroProvider>
              </GlobalTimerProvider>
            </GlobalFiltersProvider>
          </DataStoreProvider>
        </AppSettingsProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
