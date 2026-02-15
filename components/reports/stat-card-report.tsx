"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react"
import type { StatCardData } from "@/lib/types-reports"
import { cn } from "@/lib/utils"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"

interface StatCardReportProps {
  title: string
  data: StatCardData
  icon?: React.ReactNode
  formatter?: (value: number) => string
  className?: string
}

export function StatCardReport({
  title,
  data,
  icon,
  formatter = (v) => v.toString(),
  className,
}: StatCardReportProps) {
  const showDelta = data.delta !== undefined && data.delta !== null

  const { cardClassName } = useCardTransparency()

  const trendColor =
    data.trend === "up"
      ? "text-green-600 dark:text-green-400"
      : data.trend === "down"
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground"

  const TrendIcon =
    data.trend === "up" ? TrendingUpIcon : data.trend === "down" ? TrendingDownIcon : MinusIcon

  return (
    <Card className={cn("relative overflow-hidden", cardClassName, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{formatter(data.value)}</div>
          {showDelta && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span>
                {data.delta! > 0 ? "+" : ""}
                {data.delta!.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        {data.label && <p className="mt-1 text-xs text-muted-foreground">{data.label}</p>}
      </CardContent>
    </Card>
  )
}
