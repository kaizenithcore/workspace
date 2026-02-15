"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { Play, Square, Minimize2, Maximize2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useGlobalTimer } from "@/lib/hooks/use-global-timer"
import { useI18n } from "@/lib/hooks/use-i18n"
import { Card } from "@/components/ui/card"

export function FloatingTimer() {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const { isTracking, description, elapsedTime, updateDescription } = useGlobalTimer()
  const [isMinimized, setIsMinimized] = React.useState(false)
  const [isHidden, setIsHidden] = React.useState(false)

  // Don't show on tracker page
  const isOnTrackerPage = pathname === "/tracker"

  // Format elapsed time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (!isTracking || isOnTrackerPage || isHidden) {
    return null
  }

  return (
    <Card
      className={cn(
        "fixed right-6 bottom-6 z-50 shadow-lg transition-all duration-300",
        isMinimized ? "w-auto" : "w-80"
      )}
    >
      {isMinimized ? (
        // Minimized view
        <div className="flex items-center gap-2 p-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-sm font-medium">{formatTime(elapsedTime)}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsMinimized(false)}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        // Expanded view
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium">{t("tracking")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsHidden(true)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              value={description}
              onChange={(e) => updateDescription(e.target.value)}
              placeholder={t("whatAreYouWorkingOn")}
              className="text-sm"
            />

            <div className="flex items-center justify-between">
              <span className="font-mono text-2xl font-bold">{formatTime(elapsedTime)}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/tracker")}
                className="text-xs"
              >
                {t("viewDetails")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
