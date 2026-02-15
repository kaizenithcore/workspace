"use client"

import * as React from "react"
import { useUser } from "@/lib/firebase/hooks"
import { useUserDocument } from "@/lib/hooks/use-user-document"

interface CardTransparencyContextValue {
  enabled: boolean
  cardClassName: string
}

const CardTransparencyContext = React.createContext<CardTransparencyContextValue | null>(null)

export function CardTransparencyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const { userDoc } = useUserDocument(user?.uid)
  
  const enabled = userDoc?.preferences.cardTransparency ?? false
  const cardClassName = enabled ? "bg-card/80" : ""

  return (
    <CardTransparencyContext.Provider value={{ enabled, cardClassName }}>
      {children}
    </CardTransparencyContext.Provider>
  )
}

export function useCardTransparency() {
  const context = React.useContext(CardTransparencyContext)
  if (!context) {
    // Return defaults if used outside provider
    return { enabled: false, cardClassName: "" }
  }
  return context
}
