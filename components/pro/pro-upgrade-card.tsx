"use client"

import * as React from "react"
import { Sparkles, TrendingUp, Clock, FileText, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useUserPlan } from "@/hooks/use-user-plan"

interface ProUpgradeCardProps {
  className?: string
  variant?: "dashboard" | "settings" | "minimal"
  onUpgrade?: () => void
}

export function ProUpgradeCard({ className, variant = "dashboard", onUpgrade }: ProUpgradeCardProps) {
  const { t } = useI18n()
  const { isPro, plan } = useUserPlan()

  // Don't show if already Pro
  if (isPro) return null

  const isTrial = plan === "trial"

  const features = [
    { icon: TrendingUp, key: "unlimitedHistory" },
    { icon: Clock, key: "advancedReports" },
    { icon: FileText, key: "exportData" },
    { icon: Zap, key: "unlimitedTemplates" },
  ]

  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 rounded-lg bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-3 border border-amber-500/20",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium">{t("pro.upgradeNow")}</p>
            <p className="text-xs text-muted-foreground">{t("pro.price")}</p>
          </div>
        </div>
        <Button size="sm" onClick={onUpgrade} className="bg-amber-600 hover:bg-amber-700 text-white kz-lift">
          {isTrial ? t("pro.continueTrial") : t("pro.startTrial")}
        </Button>
      </div>
    )
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5",
        className,
      )}
    >
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {t("pro.title")}
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                  {t("pro.price")}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {isTrial ? t("pro.trialActive") : t("pro.subtitle")}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="space-y-2">
          {features.map(({ icon: Icon, key }) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <Icon className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <span className="text-muted-foreground">{t(`pro.feature.${key}` as any)}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 space-y-2">
          <Button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium kz-lift"
          >
            {isTrial ? t("pro.continueTrial") : t("pro.startTrial")}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {isTrial ? t("pro.trialDaysLeft") : t("pro.trialDescription")}
          </p>
        </div>

        {variant === "dashboard" && (
          <div className="pt-2 border-t border-amber-500/10">
            <p className="text-xs text-center text-muted-foreground">
              {t("pro.socialProof")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
