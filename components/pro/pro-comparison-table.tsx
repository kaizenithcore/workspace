"use client"

import * as React from "react"
import { Check, X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/hooks/use-i18n"

interface ProComparisonTableProps {
  className?: string
  onUpgrade?: () => void
}

interface Feature {
  category: string
  items: {
    name: string
    free: string | boolean
    pro: string | boolean
    highlight?: boolean
  }[]
}

export function ProComparisonTable({ className, onUpgrade }: ProComparisonTableProps) {
  const { t } = useI18n()

  const features: Feature[] = [
    {
      category: t("pro.comparison.organization"),
      items: [
        { name: t("pro.comparison.projects"), free: "5", pro: t("pro.comparison.unlimited"), highlight: true },
        { name: t("pro.comparison.categories"), free: "5", pro: t("pro.comparison.unlimited"), highlight: true },
        { name: t("pro.comparison.goals"), free: "2", pro: t("pro.comparison.unlimited"), highlight: true },
        { name: t("pro.comparison.subtasksPerTask"), free: "3", pro: t("pro.comparison.unlimited") },
      ],
    },
    {
      category: t("pro.comparison.productivity"),
      items: [
        { name: t("pro.comparison.taskDependencies"), free: false, pro: true, highlight: true },
        { name: t("pro.comparison.sessionTemplates"), free: "1", pro: t("pro.comparison.unlimited"), highlight: true },
        { name: t("pro.comparison.customFields"), free: false, pro: true },
        { name: t("pro.comparison.advancedFilters"), free: false, pro: true },
      ],
    },
    {
      category: t("pro.comparison.analytics"),
      items: [
        { name: t("pro.comparison.historyAccess"), free: "90 " + t("pro.comparison.days"), pro: t("pro.comparison.unlimited"), highlight: true },
        { name: t("pro.comparison.exportCSV"), free: "90 " + t("pro.comparison.days"), pro: t("pro.comparison.unlimited") },
        { name: t("pro.comparison.exportJSON"), free: false, pro: true, highlight: true },
        { name: t("pro.comparison.advancedReports"), free: false, pro: true, highlight: true },
        { name: t("pro.comparison.focusScoreMetrics"), free: false, pro: true },
        { name: t("pro.comparison.consistencyAnalysis"), free: false, pro: true },
      ],
    },
    {
      category: t("pro.comparison.support"),
      items: [
        { name: t("pro.comparison.emailSupport"), free: false, pro: true },
        { name: t("pro.comparison.prioritySupport"), free: false, pro: true },
        { name: t("pro.comparison.featureRequests"), free: t("pro.comparison.voting"), pro: t("pro.comparison.priority") },
      ],
    },
  ]

  return (
    <div className={cn("w-full space-y-8", className)}>
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">{t("pro.comparison.title")}</h2>
        <p className="text-muted-foreground text-lg">
          {t("pro.comparison.subtitle")}
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {/* Free Plan */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{t("pro.freePlan")}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">€0</span>
              <span className="text-muted-foreground">/ {t("pro.comparison.month")}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("pro.comparison.freeBestFor")}</p>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Badge className="bg-amber-500 text-white">{t("pro.comparison.recommended")}</Badge>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              {t("pro.proPlan")}
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">€4.50</span>
              <span className="text-muted-foreground">/ {t("pro.comparison.month")}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("pro.comparison.proBestFor")}</p>
          </div>
          <Button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium kz-lift"
          >
            {t("pro.startTrial")}
          </Button>
          <p className="text-xs text-center text-muted-foreground">{t("pro.trialDescription")}</p>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold">{t("pro.comparison.features")}</th>
                <th className="text-center py-4 px-6 font-semibold w-32">{t("pro.freePlan")}</th>
                <th className="text-center py-4 px-6 font-semibold w-32 bg-amber-500/5">{t("pro.proPlan")}</th>
              </tr>
            </thead>
            <tbody>
              {features.map((featureGroup, groupIdx) => (
                <React.Fragment key={groupIdx}>
                  <tr className="border-t">
                    <td colSpan={3} className="py-3 px-6 font-semibold text-sm bg-muted/30">
                      {featureGroup.category}
                    </td>
                  </tr>
                  {featureGroup.items.map((item, itemIdx) => (
                    <tr key={itemIdx} className={cn("border-t", item.highlight && "bg-amber-500/[0.02]")}>
                      <td className="py-3 px-6 text-sm">
                        {item.name}
                        {item.highlight && (
                          <Badge variant="secondary" className="ml-2 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                            {t("pro.comparison.popular")}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-6 text-center text-sm">
                        {typeof item.free === "boolean" ? (
                          item.free ? (
                            <Check className="h-4 w-4 inline-block text-green-600" />
                          ) : (
                            <X className="h-4 w-4 inline-block text-muted-foreground" />
                          )
                        ) : (
                          <span className="text-muted-foreground">{item.free}</span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-center text-sm bg-amber-500/[0.02]">
                        {typeof item.pro === "boolean" ? (
                          item.pro ? (
                            <Check className="h-4 w-4 inline-block text-amber-600 dark:text-amber-500" />
                          ) : (
                            <X className="h-4 w-4 inline-block text-muted-foreground" />
                          )
                        ) : (
                          <span className="font-medium">{item.pro}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="max-w-2xl mx-auto text-center space-y-4 py-8">
        <h3 className="text-xl font-semibold">{t("pro.valueProposition.whyPro")}</h3>
        <p className="text-muted-foreground">
          {t("pro.valueProposition.explanation")}
        </p>
        <Button
          onClick={onUpgrade}
          size="lg"
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium kz-lift"
        >
          {t("pro.startTrial")}
        </Button>
      </div>
    </div>
  )
}
