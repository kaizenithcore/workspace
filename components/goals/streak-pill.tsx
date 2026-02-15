import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreakPillProps {
  days: number
  className?: string
  showLabel?: boolean
}

export function StreakPill({ days, className, showLabel = true }: StreakPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-50 border border-orange-300",
        className
      )}
    >
      <Flame className="h-4 w-4 text-orange-500" />
      <span className="font-semibold text-orange-400">{days}</span>
      {showLabel && <span className="text-xs text-orange-600">day streak</span>}
    </div>
  )
}
