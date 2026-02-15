"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

interface KeyboardShortcutsContextType {
  openQuickAdd: () => void
  setOpenQuickAdd: (fn: () => void) => void
}

const KeyboardShortcutsContext = React.createContext<KeyboardShortcutsContextType | null>(null)

export function useKeyboardShortcuts() {
  const context = React.useContext(KeyboardShortcutsContext)
  if (!context) {
    throw new Error("useKeyboardShortcuts must be used within a KeyboardShortcutsProvider")
  }
  return context
}

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const openQuickAddRef = React.useRef<() => void>(() => {})

  const setOpenQuickAdd = React.useCallback((fn: () => void) => {
    openQuickAddRef.current = fn
  }, [])

  const openQuickAdd = React.useCallback(() => {
    openQuickAddRef.current()
  }, [])

  React.useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    // Ignore if typing in an input or editable element
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target as HTMLElement).isContentEditable
    ) {
      console.log("Input element focused, ignoring keyboard shortcuts")
      return
    }

    const key = e.key.toLowerCase()
    console.log("Key pressed:", key) // Debug log to see which key is detected

    switch (key) {
      // N - New item (Quick Add)
      case "n":
        e.preventDefault()
        openQuickAddRef.current()
        break

      // D - Dashboard
      case "d":
        e.preventDefault()
        router.push("/")
        break

      // Q - Agenda
      case "q":
        e.preventDefault()
        router.push("/agenda")
        break

      // W - Tasks
      case "w":
        e.preventDefault()
        router.push("/tasks")
        break

      // E - Pomodoro
      case "e":
        e.preventDefault()
        router.push("/pomodoro")
        break

      // R - Time Tracker
      case "r":
        e.preventDefault()
        router.push("/tracker")
        break

      // T - Reports
      case "t":
        e.preventDefault()
        router.push("/reports")
        break

      default:
        break
    }
  }

  window.addEventListener("keydown", handleKeyDown)
  return () => window.removeEventListener("keydown", handleKeyDown)
}, [router])


  return (
    <KeyboardShortcutsContext.Provider value={{ openQuickAdd, setOpenQuickAdd }}>
      {children}
    </KeyboardShortcutsContext.Provider>
  )
}
