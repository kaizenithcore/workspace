"use client"

import * as React from "react"
import { Play, Pause, RotateCcw, Settings2, Link2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useI18n } from "@/lib/hooks/use-i18n"
import { usePomodoroSound } from "@/hooks/use-pomodoro-sound"
import type { Task, Category, Project } from "@/lib/types"
import { useGlobalPomodoro } from "@/lib/hooks/use-global-pomodoro"

interface PomodoroTimerProps {
  boundTask?: Task
  categories?: Category[]
  projects?: Project[]
  onUnbindTask?: () => void
  onBindTask?: () => void
  className?: string
}

type TimerType = "pomodoro" | "short_break" | "long_break"

const PRESETS = {
  pomodoro: { label: "Focus", color: "text-primary" },
  short_break: { label: "Short Break", color: "text-emerald-500" },
  long_break: { label: "Long Break", color: "text-sky-500" },
}

export function PomodoroTimer({
  boundTask,
  categories = [],
  projects = [],
  onUnbindTask,
  onBindTask,
  className,
}: PomodoroTimerProps) {
  const { t } = useI18n()
  const pomodoro = useGlobalPomodoro()
  const { playSound } = usePomodoroSound()
  const [lastPhase, setLastPhase] = React.useState(pomodoro.phase)

  // Play sound when pomodoro phase changes
  React.useEffect(() => {
    if (lastPhase !== pomodoro.phase && pomodoro.secondsRemaining === pomodoro.totalSeconds) {
      playSound()
      setLastPhase(pomodoro.phase)
    }
  }, [pomodoro.phase, pomodoro.secondsRemaining, pomodoro.totalSeconds, playSound, lastPhase])

  const timerType: TimerType =
    pomodoro.phase === "focus" ? "pomodoro" : pomodoro.phase === "shortBreak" ? "short_break" : "long_break"

  const effectiveBoundTask = boundTask ?? pomodoro.boundTask
  const category = effectiveBoundTask?.categoryIds
    ? categories.find((c) => c.id === effectiveBoundTask.categoryIds?.[0])
    : null
  const project = effectiveBoundTask?.projectId ? projects.find((p) => p.id === effectiveBoundTask.projectId) : null

  const switchTimer = (type: TimerType) => {
    const nextPhase = type === "pomodoro" ? "focus" : type === "short_break" ? "shortBreak" : "longBreak"
    pomodoro.setPhase(nextPhase)
  }

  const toggleTimer = () => {
    if (pomodoro.isRunning) {
      pomodoro.pauseTimer()
    } else {
      pomodoro.startTimer()
    }
  }

  const resetTimer = () => {
    pomodoro.resetTimer()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progress = pomodoro.totalSeconds > 0 ? (pomodoro.secondsRemaining / pomodoro.totalSeconds) * 100 : 0

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg mb-8">
        {(Object.keys(PRESETS) as TimerType[]).map((type) => (
          <button
            key={type}
            onClick={() => switchTimer(type)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              timerType === type ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {PRESETS[type].label}
          </button>
        ))}
      </div>

      <div className={cn(
        "relative flex items-center justify-center w-72 h-72 md:w-80 md:h-80",
        pomodoro.isRunning && "kz-breathe"
      )}>
        <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${progress * 2.83} 283`}
            className={cn(PRESETS[timerType].color, pomodoro.isRunning && "kz-pulse-glow")}
            style={{ transition: "stroke-dasharray 0.3s ease-out" }}
          />
        </svg>

        <div className="text-center z-10">
          <div className={cn("text-6xl md:text-7xl font-bold tracking-tight font-mono", PRESETS[timerType].color)}>
            {formatTime(pomodoro.secondsRemaining)}
          </div>
          <div className="text-sm text-muted-foreground mt-2">{PRESETS[timerType].label}</div>
        </div>
      </div>

      {effectiveBoundTask && (
        <div className="flex flex-col items-center gap-2 mt-6 px-4 py-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{effectiveBoundTask?.title}</span>
            <button
              onClick={() => (onUnbindTask ? onUnbindTask() : pomodoro.bindTask(null))}
              className="p-0.5 rounded hover:bg-muted"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {category && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {category.name}
              </span>
            )}
            {project && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${project.color}20`, color: project.color }}
              >
                {project.name}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mt-8">
        <Button
          variant="outline"
          size="icon"
          onClick={resetTimer}
          disabled={pomodoro.secondsRemaining === pomodoro.totalSeconds}
          aria-label={t("resetTimer")}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button
          size="lg"
          className="h-14 w-14 rounded-full"
          onClick={toggleTimer}
          aria-label={pomodoro.isRunning ? t("pause") : t("start")}
        >
          {pomodoro.isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label={t("timerSettings")}>
              <Settings2 className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{t("quickActions")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onBindTask}>
              <Link2 className="h-4 w-4 mr-2" />
              {t("linkToTask")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={pomodoro.resetPomodoros}>{t("resetCount")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-8 text-center">
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-3 w-3 rounded-full transition-colors",
                i < pomodoro.pomodorosCompleted % 4 ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {pomodoro.pomodorosCompleted} {t("pomodorosCompletedToday")}
        </p>
      </div>
    </div>
  )
}
