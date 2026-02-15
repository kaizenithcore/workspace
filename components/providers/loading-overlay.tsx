"use client"

import * as React from "react"
import { useUser } from "@/lib/firebase/hooks"
import { useUserDocument } from "@/lib/hooks/use-user-document"
import { Loader2 } from "lucide-react"

const MIN_DISPLAY_TIME = 2000 // 2 seconds minimum display

interface LoadingOverlayProps {
  children: React.ReactNode
}

export function LoadingOverlay({ children }: LoadingOverlayProps) {
  const { user, loading: authLoading } = useUser()
  const { userDoc, loading: userDocLoading } = useUserDocument(user?.uid)
  const [showOverlay, setShowOverlay] = React.useState(true)
  const [canDismiss, setCanDismiss] = React.useState(false)
  const startTimeRef = React.useRef<number>(Date.now())

  // Track when we started showing the overlay
  React.useEffect(() => {
    if (authLoading || userDocLoading) {
      startTimeRef.current = Date.now()
    }
  }, [authLoading, userDocLoading])

  // Set canDismiss after minimum display time
  React.useEffect(() => {
    const elapsed = Date.now() - startTimeRef.current
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed)

    const timer = setTimeout(() => {
      setCanDismiss(true)
    }, remaining)

    return () => clearTimeout(timer)
  }, [authLoading, userDocLoading])

  // Dismiss overlay when data is loaded AND minimum time has passed
  React.useEffect(() => {
    if (!authLoading && canDismiss) {
      // If user is not authenticated, dismiss immediately
      if (!user) {
        setShowOverlay(false)
        return
      }

      // If user is authenticated, wait for user document
      if (!userDocLoading && userDoc) {
        setShowOverlay(false)
      }
    }
  }, [authLoading, userDocLoading, user, userDoc, canDismiss])

  if (!showOverlay) {
    return <>{children}</>
  }

  return (
    <>
      {/* Full-screen overlay */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          {/* Logo or brand */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
                <img src="/kaizenith-works.png" alt="Kaizenith Logo" className="w-50" />
              {/* <div className="absolute -bottom-1 -right-10 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <Loader2 className="h-3 w-3 animate-spin text-primary-foreground" />
              </div> */}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">KAIZENITH WORKSPACE</h1>
          </div>

          {/* Loading text */}
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">
              {authLoading ? "Authenticating..." : userDocLoading ? "Loading your workspace..." : "Welcome back"}
            </p>
            {/* Progress indicator */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
                  style={{
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Render children behind overlay (so they're ready when overlay dismisses) */}
      <div className="opacity-0 pointer-events-none">{children}</div>
    </>
  )
}
