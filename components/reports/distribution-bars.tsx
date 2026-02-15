"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ProjectDistribution, CategoryDistribution } from "@/lib/types-reports"

interface DistributionBarsProps {
  title: string
  description?: string
  items: (ProjectDistribution | CategoryDistribution)[]
  showDelta?: boolean
  maxItems?: number
  className?: string
}

/**
 * Horizontal bar chart showing distribution of time/tasks
 */
export function DistributionBars({
  title,
  description,
  items,
  showDelta = false,
  maxItems = 10,
  className,
}: DistributionBarsProps) {
  const displayItems = items.slice(0, maxItems)
  const maxPercentage = Math.max(...displayItems.map((i) => i.percentage), 1)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayItems.map((item, idx) => (
            <DistributionBar 
              key={'projectId' in item ? item.projectId : item.categoryId} 
              item={item} 
              maxPercentage={maxPercentage} 
              showDelta={showDelta} 
            />
          ))}
        </div>

        {items.length > maxItems && (
          <div className="mt-3 text-xs text-muted-foreground text-center">
            +{items.length - maxItems} más
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Individual distribution bar
 */
function DistributionBar({
  item,
  maxPercentage,
  showDelta,
}: {
  item: ProjectDistribution | CategoryDistribution
  maxPercentage: number
  showDelta: boolean
}) {
  const barWidth = (item.percentage / maxPercentage) * 100
  const hours = item.timeSeconds / 3600
  
  // Get name based on whether it's project or category
  const name = 'projectName' in item ? item.projectName : item.categoryName
  const id = 'projectId' in item ? item.projectId : item.categoryId

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="font-medium truncate">{name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-muted-foreground text-xs">
            {hours.toFixed(1)}h · {item.tasksCount} tareas
          </span>
          {showDelta && item.delta !== undefined && item.delta !== null && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                item.delta > 0
                  ? "text-green-600 dark:text-green-400"
                  : item.delta < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
              )}
            >
              {item.delta > 0 ? "+" : ""}
              {item.delta.toFixed(0)}%
            </Badge>
          )}
        </div>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{
            width: `${barWidth}%`,
            backgroundColor: item.color,
          }}
          aria-label={`${item.percentage.toFixed(1)}%`}
        />
      </div>
    </div>
  )
}
