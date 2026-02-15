"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { HeatmapCell } from "@/lib/types-reports"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface HeatmapProps {
  title: string
  description?: string
  cells: HeatmapCell[]
  className?: string
}

/**
 * Heatmap component showing daily activity intensity
 */
export function Heatmap({ title, description, cells, className }: HeatmapProps) {
  // Group cells by week
  const weeks: HeatmapCell[][] = []
  let currentWeek: HeatmapCell[] = []

  cells.forEach((cell, idx) => {
    currentWeek.push(cell)
    if (currentWeek.length === 7 || idx === cells.length - 1) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex gap-1">
              {week.map((cell) => (
                <HeatmapCell key={cell.date.toISOString()} cell={cell} />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Menos</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((intensity) => (
              <div
                key={intensity}
                className={cn(
                  "h-3 w-3 rounded-sm",
                  getIntensityColor(intensity as HeatmapCell["intensity"])
                )}
                aria-label={`Intensidad ${intensity}`}
              />
            ))}
          </div>
          <span>Más</span>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Individual heatmap cell with tooltip
 */
function HeatmapCell({ cell }: { cell: HeatmapCell }) {
  const intensityColor = getIntensityColor(cell.intensity)

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "h-4 w-4 rounded-sm transition-all hover:ring-2 hover:ring-primary hover:ring-offset-1",
              intensityColor
            )}
            aria-label={`${cell.date.toLocaleDateString()}: ${cell.label}`}
            role="gridcell"
          />
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <div className="font-medium">{cell.date.toLocaleDateString()}</div>
            <div className="text-muted-foreground">{cell.label}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Get Tailwind class for intensity level
 */
function getIntensityColor(intensity: HeatmapCell["intensity"]): string {
  switch (intensity) {
    case 0:
      return "bg-muted"
    case 1:
      return "bg-blue-200 dark:bg-blue-900/30"
    case 2:
      return "bg-blue-400 dark:bg-blue-700/50"
    case 3:
      return "bg-blue-600 dark:bg-blue-600/70"
    case 4:
      return "bg-blue-800 dark:bg-blue-500"
    default:
      return "bg-muted"
  }
}
