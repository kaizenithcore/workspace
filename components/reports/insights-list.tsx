"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ReportInsight } from "@/lib/types-reports"
import {
  LightbulbIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  TargetIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
} from "lucide-react"

interface InsightsListProps {
  insights: ReportInsight[]
  className?: string
  title?: string
  summary?: string
  emptyMessage?: string
  actionSlot?: React.ReactNode
}

/**
 * Display list of auto-generated insights
 */
export function InsightsList({
  insights,
  className,
  title,
  summary,
  emptyMessage,
  actionSlot,
}: InsightsListProps) {
  const hasInsights = insights.length > 0
  const useFirstAsSummary = hasInsights && !summary
  const highlightMessage = summary
    ? summary
    : useFirstAsSummary
    ? insights[0].message
    : emptyMessage || "No hay insights disponibles para este período."
  const remainingInsights = useFirstAsSummary ? insights.slice(1) : insights

  return (
    <Card
      className={cn(
        className,
        "bg-gradient-to-r from-primary/50 to-primary/20 border-primary/20"
      )}
    >
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <TrendingUpIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold">{title || "Insights"}</h3>
            <p className="text-sm text-gray-300">{highlightMessage}</p>
          </div>
          {actionSlot && <div className="flex-shrink-0">{actionSlot}</div>}
        </div>
        {remainingInsights.length > 0 && (
          <div className="space-y-3">
            {remainingInsights.map((insight, idx) => (
              <InsightItem key={idx} insight={insight} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Individual insight item
 */
function InsightItem({ insight }: { insight: ReportInsight }) {
  const Icon = getInsightIcon(insight.type, insight.sentiment)

  const sentimentColor =
    insight.sentiment === "success"
      ? "text-green-600 dark:text-green-400"
      : insight.sentiment === "warning"
      ? "text-amber-600 dark:text-amber-400"
      : insight.sentiment === "error"
      ? "text-red-600 dark:text-red-400"
      : "text-blue-600 dark:text-blue-400"

  const bgColor =
    insight.sentiment === "success"
      ? "bg-green-500/10"
      : insight.sentiment === "warning"
      ? "bg-amber-500/10"
      : insight.sentiment === "error"
      ? "bg-red-500/10"
      : "bg-blue-500/10"

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent",
        bgColor
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", sentimentColor)} />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium">{insight.message}</p>
        {insight.metadata && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(insight.metadata).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key}: {value}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Get icon based on insight type and sentiment
 */
function getInsightIcon(
  type: ReportInsight["type"],
  sentiment: ReportInsight["sentiment"]
): React.ComponentType<{ className?: string }> {
  if (sentiment === "success") return CheckCircle2Icon
  if (sentiment === "error") return AlertTriangleIcon

  switch (type) {
    case "consistency":
      return TargetIcon
    case "comparison":
      return sentiment === "info" ? TrendingUpIcon : TrendingDownIcon
    case "streak":
      return TargetIcon
    case "focus":
      return LightbulbIcon
    case "goal":
      return sentiment === "warning" ? AlertTriangleIcon : CheckCircle2Icon
    default:
      return LightbulbIcon
  }
}
