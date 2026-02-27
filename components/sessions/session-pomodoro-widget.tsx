"use client"

import * as React from "react"
import { Clock, Play, Pause, CheckCircle2 } from "lucide-react"
import { useI18n } from "@/lib/hooks/use-i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface SessionPomodoroWidgetProps {
  sessionId: string
  pomodorosCompleted: number
  onPomodoroComplete?: (sessionId: string, count: number) => Promise<void>
  isActive?: boolean
  className?: string
}

/**
 * Embedded Pomodoro widget for a session.
 * Shows current pomodoro count and allows tracking them.
 */
export function SessionPomodoroWidget({
  sessionId,
  pomodorosCompleted,
  onPomodoroComplete,
  isActive = false,
  className,
}: SessionPomodoroWidgetProps) {
  const { t } = useI18n()
  const [isRecording, setIsRecording] = React.useState(false)
  const [timeRemaining, setTimeRemaining] = React.useState(25 * 60) // 25 minutes in seconds
  const [isLoading, setIsLoading] = React.useState(false)

  // Reference to track the timer interval
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  // Timer effect
  React.useEffect(() => {
    if (!isRecording) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Pomodoro completed
          setIsRecording(false)
          return 25 * 60 // Reset to 25 minutes
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRecording])

  const handleStartPomodoro = () => {
    setIsRecording(true)
  }

  const handlePausePomodoro = () => {
    setIsRecording(false)
  }

  const handleCompletePomodoro = async () => {
    setIsLoading(true)
    try {
      await onPomodoroComplete?.(sessionId, pomodorosCompleted + 1)
      setTimeRemaining(25 * 60)
      setIsRecording(false)
    } catch (error) {
      console.error("Failed to record pomodoro", error)
    } finally {
      setIsLoading(false)
    }
  }

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const progress = ((25 * 60 - timeRemaining) / (25 * 60)) * 100

  return (
    <Card className={`bg-card/50 border-border/40 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          🍅 {t("sessions.pomodoro") || "Pomodoro"}
        </CardTitle>
        <CardDescription>
          {pomodorosCompleted} {t("sessions.pomodoros") || "pomodoros"} completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Timer Display */}
        <div className="text-center space-y-2">
          <div className="text-4xl font-mono font-bold">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isRecording ? (
            <Button
              onClick={handleStartPomodoro}
              disabled={isLoading || !isActive}
              className="flex-1"
              size="sm"
              variant="default"
            >
              <Play className="h-4 w-4 mr-1" />
              {t("sessions.start") || "Start"}
            </Button>
          ) : (
            <Button
              onClick={handlePausePomodoro}
              disabled={isLoading || !isActive}
              className="flex-1"
              size="sm"
              variant="outline"
            >
              <Pause className="h-4 w-4 mr-1" />
              {t("sessions.pause") || "Pause"}
            </Button>
          )}
          <Button
            onClick={handleCompletePomodoro}
            disabled={isLoading || !isActive}
            className="flex-1"
            size="sm"
            variant="default"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {t("sessions.complete") || "Complete"}
          </Button>
        </div>

        {/* Summary */}
        <div className="text-xs text-muted-foreground text-center">
          {isRecording
            ? "Recording pomodoro..."
            : `${pomodorosCompleted} ${pomodorosCompleted === 1 ? "pomodoro" : "pomodoros"} earned`}
        </div>
      </CardContent>
    </Card>
  )
}
