"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { X, Play, Pause, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useGlobalPomodoro } from "@/lib/hooks/use-global-pomodoro"
import { useI18n } from "@/lib/hooks/use-i18n"
import { cn } from "@/lib/utils"
import { usePomodoroSound } from "@/hooks/use-pomodoro-sound"

export function FloatingPomodoro() {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useI18n()
  const pomodoro = useGlobalPomodoro()
  const [isMinimized, setIsMinimized] = React.useState(false)
  const { playSound } = usePomodoroSound()
  const [lastPhase, setLastPhase] = React.useState(pomodoro.phase)

  // Play sound when pomodoro phase changes
  React.useEffect(() => {
    if (lastPhase !== pomodoro.phase && pomodoro.secondsRemaining === pomodoro.totalSeconds) {
      playSound()
      setLastPhase(pomodoro.phase)
    }
  }, [pomodoro.phase, pomodoro.secondsRemaining, pomodoro.totalSeconds, playSound, lastPhase])

  // Don't show on the pomodoro page
  if (pathname === "/pomodoro") {
    return null
  }

  // Only show when timer is actively running
  if (!pomodoro.isRunning) {
    return null
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getPhaseLabel = () => {
    switch (pomodoro.phase) {
      case "focus":
        return t("focus")
      case "shortBreak":
        return t("shortBreak")
      case "longBreak":
        return t("longBreak")
    }
  }

  const getPhaseColor = () => {
    switch (pomodoro.phase) {
      case "focus":
        return "bg-primary"
      case "shortBreak":
        return "bg-green-500"
      case "longBreak":
        return "bg-blue-500"
    }
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className={cn("rounded-full h-14 w-14 shadow-lg", getPhaseColor())}
          onClick={() => setIsMinimized(false)}
        >
          <Timer className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 shadow-xl border-2 min-w-[280px]">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", pomodoro.isRunning ? "animate-pulse" : "", getPhaseColor())} />
            <span className="text-sm font-medium">{getPhaseLabel()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsMinimized(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-4xl font-bold tabular-nums">
            {formatTime(pomodoro.secondsRemaining)}
          </div>
          {pomodoro.boundTask && (
            <div className="text-xs text-muted-foreground mt-1 truncate">
              {pomodoro.boundTask.title}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={pomodoro.isRunning ? pomodoro.pauseTimer : pomodoro.startTimer}
          >
            {pomodoro.isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                {t("pause")}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {t("start")}
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.push("/pomodoro")}
          >
            {t("viewDetails")}
          </Button>
        </div>
      </div>
    </Card>
  )
}
