"use client"

import * as React from "react"
import { Sparkles, Check, X, TrendingUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/hooks/use-i18n"

export type LimitType = "projects" | "categories" | "goals" | "subtasks" | "templates" | "export" | "history"

interface ProLimitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  limitType: LimitType
  currentCount?: number
  limitCount?: number
  onUpgrade?: () => void
}

export function ProLimitModal({
  open,
  onOpenChange,
  limitType,
  currentCount,
  limitCount,
  onUpgrade,
}: ProLimitModalProps) {
  const { t } = useI18n()

  const limitConfig = {
    projects: { icon: "📁", color: "blue" },
    categories: { icon: "🏷️", color: "purple" },
    goals: { icon: "🎯", color: "green" },
    subtasks: { icon: "✓", color: "indigo" },
    templates: { icon: "📋", color: "amber" },
    export: { icon: "📊", color: "emerald" },
    history: { icon: "📅", color: "orange" },
  }

  const config = limitConfig[limitType] || limitConfig.projects

  const comparisonFeatures = [
    { free: t(`pro.limit.${limitType}.freeLimitText` as any, { limit: limitCount }), pro: t(`pro.limit.${limitType}.proLimitText` as any) },
  ]

  // Add contextual features based on limit type
  if (limitType === "projects" || limitType === "categories") {
    comparisonFeatures.push(
      { free: t("pro.limit.basic.freeFeature1"), pro: t("pro.limit.basic.proFeature1") },
      { free: t("pro.limit.basic.freeFeature2"), pro: t("pro.limit.basic.proFeature2") }
    )
  } else if (limitType === "goals") {
    comparisonFeatures.push(
      { free: t("pro.limit.goals.freeFeature1"), pro: t("pro.limit.goals.proFeature1") },
      { free: t("pro.limit.goals.freeFeature2"), pro: t("pro.limit.goals.proFeature2") }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-2xl shadow-lg">
              {config.icon}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                {t("pro.limit.title")}
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                  {t("pro.price")}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                {t(`pro.limit.${limitType}.description` as any, { current: currentCount, limit: limitCount })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Limitation */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 flex-shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-sm">{t("pro.limit.currentLimit")}</p>
                <p className="text-sm text-muted-foreground">
                  {t(`pro.limit.${limitType}.explanation` as any)}
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="grid grid-cols-2 gap-4">
            {/* Free Plan */}
            <div className="rounded-lg border bg-card p-4 space-y-3 kz-card-hover">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{t("pro.freePlan")}</h3>
                <Badge variant="outline" className="text-xs">{t("pro.current")}</Badge>
              </div>
              <div className="space-y-2">
                {comparisonFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <X className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature.free}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Plan */}
            <div className="rounded-lg border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4 space-y-3 kz-card-hover">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                  {t("pro.proPlan")}
                </h3>
                <Badge className="text-xs bg-amber-500 text-white">{t("pro.price")}</Badge>
              </div>
              <div className="space-y-2">
                {comparisonFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{feature.pro}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-center">
              <span className="font-medium">{t("pro.valueProposition.title")}</span>{" "}
              {t(`pro.valueProposition.${limitType}` as any)}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {t("pro.limit.maybeLater")}
          </Button>
          <Button
            onClick={() => {
              onUpgrade?.()
              onOpenChange(false)
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium kz-lift"
          >
            {t("pro.startTrial")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
