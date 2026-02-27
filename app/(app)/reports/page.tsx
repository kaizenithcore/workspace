"use client"

import * as React from "react"
import {
  Download,
  Timer,
  Clock,
  CheckSquare,
  TrendingUp,
  FileDown,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { PageTransition } from "@/components/ui/page-transition"
import { StatCardReport } from "@/components/reports/stat-card-report"
import { Heatmap } from "@/components/reports/heatmap"
import { DistributionBars } from "@/components/reports/distribution-bars"
import { InsightsList } from "@/components/reports/insights-list"
import { GoalProgressSection } from "@/components/reports/goal-mini-card"
import { useReports } from "@/lib/hooks/use-reports"
import { useGoals } from "@/lib/hooks/use-goals"
import type { ReportFilters, HeatmapCell } from "@/lib/types-reports"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"
import { useUserPlan } from "@/hooks/use-user-plan"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function ReportsPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const { isPro } = useUserPlan()
  const { goals } = useGoals()
  const { cardClassName } = useCardTransparency()

  // Filters state
  const [filters, setFilters] = React.useState<ReportFilters>({
    range: "week",
    compareWithPrevious: true,
    scope: "global",
  })

  const maxFreeDays = 90

  // Fetch report data
  const { data, loading, error } = useReports(filters)

  // Format time helper
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  // Format heatmap cells from daily buckets
  const heatmapCells = React.useMemo<HeatmapCell[]>(() => {
    if (!data) return []
    return data.dailyBuckets.map((bucket) => ({
      date: bucket.date,
      intensity: bucket.intensity as HeatmapCell["intensity"],
      label: `${bucket.tasksCompleted} tareas, ${(bucket.timeSeconds / 3600).toFixed(1)}h`,
    }))
  }, [data])

  // Enforce Free plan limits for report range
  React.useEffect(() => {
    if (isPro) return

    if (filters.range === "year") {
      toast({
        title: t("reports.limitTitle") || "Plan Free",
        description: t("reports.limitRange") || "El historial anual es Pro. Mostrando 3 meses.",
      })
      setFilters((prev) => ({ ...prev, range: "month" }))
      return
    }

    if (filters.range === "custom" && filters.customRange) {
      const days = Math.ceil(
        (filters.customRange.end.getTime() - filters.customRange.start.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      if (days > maxFreeDays) {
        toast({
          title: t("reports.limitTitle") || "Plan Free",
          description: t("reports.limitCustom") || "El rango personalizado supera 3 meses. Ajustando.",
        })
        setFilters((prev) => ({ ...prev, range: "month", customRange: undefined }))
      }
    }
  }, [filters.range, filters.customRange, isPro, toast, t])

  // Filter active goals - use the same filtering logic as useReports
  const activeGoals = React.useMemo(() => {
    if (!data) return []
    // Match the filtered goals from the report data
    return goals.filter((g) => {
      const matchesStatus = g.status === "active"
      if (filters.scope === "project" && filters.projectId) {
        return matchesStatus && g.projectIds?.includes(filters.projectId)
      } else if (filters.scope === "category" && filters.categoryId) {
        return matchesStatus && g.categoryIds?.includes(filters.categoryId)
      } else if (filters.scope === "goals") {
        return matchesStatus && g.includeInChallenges
      }
      return matchesStatus
    })
  }, [goals, data, filters])

  // Export CSV handler
  const handleExportCSV = () => {
    if (!data) return

    let exportBuckets = data.dailyBuckets
    if (!isPro && exportBuckets.length > maxFreeDays) {
      exportBuckets = exportBuckets.slice(-maxFreeDays)
      toast({
        title: t("reports.limitTitle") || "Plan Free",
        description: t("reports.limitExport") || "Export limitado a los ultimos 3 meses.",
      })
    }

    const rows = [
      ["Fecha", "Tareas", "Tiempo (min)", "Pomodoros", "Intensidad"],
      ...exportBuckets.map((b) => [
        b.date.toLocaleDateString(),
        b.tasksCompleted.toString(),
        Math.round(b.timeSeconds / 60).toString(),
        b.pomodorosCompleted.toString(),
        b.intensity.toFixed(1),
      ]),
    ]

    const csv = rows.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `focusflow-report-${data.period.start.toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <Card className={cn("border-red-600",cardClassName)}>
          <CardContent className="p-6 text-center text-red-600">
            Error: {error.message}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <PageTransition>
      <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("reportsTitle")}
          </h1>
          <p className="text-muted-foreground">
            {data.period.start.toLocaleDateString()} -{" "}
            {data.period.end.toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Range selector */}
          <Select
            value={filters.range}
            onValueChange={(value) =>
              setFilters({ ...filters, range: value as ReportFilters["range"] })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {/* Compare toggle */}
          <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
            <Switch
              id="compare-toggle"
              checked={filters.compareWithPrevious}
              onCheckedChange={(checked) =>
                setFilters({ ...filters, compareWithPrevious: checked })
              }
            />
            <Label htmlFor="compare-toggle" className="text-sm cursor-pointer">
              Comparar
            </Label>
          </div>

          {/* Export button */}
          <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
            <FileDown className="h-4 w-4" />
            Exportar CSV
            {!isPro && (
              <Badge variant="outline" className="ml-2 text-[10px]">
                Free
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCardReport
          title={t("totalTimeTrackedTitle")}
          data={{
            value: data.stats.totalTimeSeconds / 3600,
            delta: data.previousStats
              ? ((data.stats.totalTimeSeconds - data.previousStats.totalTimeSeconds) /
                  data.previousStats.totalTimeSeconds) *
                100
              : undefined,
            trend:
              data.previousStats && data.stats.totalTimeSeconds > data.previousStats.totalTimeSeconds
                ? "up"
                : data.previousStats && data.stats.totalTimeSeconds < data.previousStats.totalTimeSeconds
                ? "down"
                : "neutral",
          }}
          formatter={(v) => `${v.toFixed(1)}h`}
          icon={<Clock className="h-4 w-4" />}
        />

        <StatCardReport
          title={t("tasksCompleted")}
          data={{
            value: data.stats.tasksCompleted,
            delta: data.previousStats
              ? ((data.stats.tasksCompleted - data.previousStats.tasksCompleted) /
                  data.previousStats.tasksCompleted) *
                100
              : undefined,
            trend:
              data.previousStats && data.stats.tasksCompleted > data.previousStats.tasksCompleted
                ? "up"
                : data.previousStats && data.stats.tasksCompleted < data.previousStats.tasksCompleted
                ? "down"
                : "neutral",
          }}
          icon={<CheckSquare className={cn("h-4 w-4",cardClassName)} />}
        />

        <StatCardReport
          title={t("pomodorosCompletedReport")}
          data={{
            value: data.stats.pomodorosCompleted,
            delta: data.previousStats
              ? ((data.stats.pomodorosCompleted - data.previousStats.pomodorosCompleted) /
                  data.previousStats.pomodorosCompleted) *
                100
              : undefined,
            trend:
              data.previousStats && data.stats.pomodorosCompleted > data.previousStats.pomodorosCompleted
                ? "up"
                : data.previousStats && data.stats.pomodorosCompleted < data.previousStats.pomodorosCompleted
                ? "down"
                : "neutral",
          }}
          icon={<Timer className={cn("h-4 w-4",cardClassName)} />}
        />

        <StatCardReport
          title={t("focusScore")}
          data={{
            value: data.stats.focusScore.total,
            label: t("focusScoreLabel"),
          }}
          formatter={(v) => `${v.toFixed(0)}/100`}
          icon={<TrendingUp className={cn("h-4 w-4",cardClassName)} />}
        />
      </div>

      {/* Consistency Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("consistency")}</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Heatmap
              className={cardClassName}
              title={t("dailyActivity")}
              description={t("dailyActivityDescription")}
              cells={heatmapCells}
            />
          </div>

          <Card className={cardClassName}>
            <CardHeader>
              <CardTitle className="text-base">{t("consistencyMetrics")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("activeDays")}</span>
                  <span className="font-medium">
                    {data.consistency.activeDays} / {data.consistency.totalDays}
                  </span>
                </div>
                <Badge variant="outline" className="mt-1">
                  {data.consistency.activePercentage.toFixed(0)}% activo
                </Badge>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("currentStreak")}</span>
                  <span className="font-bold text-lg">
                    {data.consistency.streak.current} días 🔥
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("stdDev")}</span>
                  <span className="font-medium">
                    {data.consistency.stdDevHours.toFixed(1)}h
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("stdDevDescription")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Focus Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("focus")}</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <DistributionBars
            title={t("projectDistribution")}
            description={t("projectDistributionDescription")}
            items={data.projectDistribution}
            showDelta={filters.compareWithPrevious}
            maxItems={8}
            className={cardClassName}
          />

          <DistributionBars
            title={t("categoryDistribution")}
            description={t("categoryDistributionDescription")}
            items={data.categoryDistribution}
            showDelta={filters.compareWithPrevious}
            maxItems={8}
            className={cardClassName}
          />
        </div>
      </div>

      {/* Goal Progress Section */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("goalProgress")}</h2>
            <Badge variant="secondary">{activeGoals.length} {t("active")}</Badge>
          </div>
          <GoalProgressSection goals={activeGoals} progress={data.goalProgress}  />
        </div>
      )}

      {/* Insights Section */}
      <InsightsList insights={data.insights} className={cardClassName} />
    </div>
    </PageTransition>
  )
}
