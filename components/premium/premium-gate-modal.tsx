/**
 * PremiumGateModal Component
 * 
 * Shows when user hits a feature limit
 * Explains premium benefits and provides upgrade button
 */

"use client"

import * as React from "react"
import { Zap } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { usePremium } from "@/hooks/use-premium"
import { useI18n } from "@/lib/hooks/use-i18n"

interface PremiumGateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  limitType: "pets" | "records" | "features"
}

export function PremiumGateModal({
  open,
  onOpenChange,
  limitType,
}: PremiumGateModalProps) {
  const { t } = useI18n()
  const { startCheckout, checkoutLoading } = usePremium()
  const [selectedPlan, setSelectedPlan] = React.useState<"monthly" | "yearly">("monthly")

  const getContent = () => {
    switch (limitType) {
      case "pets":
        return {
          title: t("premiumRequired") || "Premium Required",
          description:
            t("premiumPetLimit") ||
            "You've reached the free plan limit of 1 pet. Upgrade to Pro for unlimited pets.",
          feature: t("unlimitedPets") || "Unlimited Pets",
        }
      case "records":
        return {
          title: t("premiumRequired") || "Premium Required",
          description:
            t("premiumRecordLimit") ||
            "You've reached the free plan limit of 10 records per category. Upgrade to Pro for unlimited records.",
          feature: t("unlimitedRecords") || "Unlimited Records",
        }
      case "features":
        return {
          title: t("premiumRequired") || "Premium Required",
          description:
            t("premiumFeatureRequired") ||
            "This feature is only available in the Pro plan. Upgrade now to unlock advanced features.",
          feature: t("advancedFeatures") || "Advanced Features",
        }
      default:
        return {
          title: "Upgrade to Pro",
          description: "Unlock premium features and remove limits.",
          feature: "Premium Access",
        }
    }
  }

  const content = getContent()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-100 p-2">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle>{content.title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{content.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Plan selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`rounded-lg border-2 p-3 text-center transition-all ${
                selectedPlan === "monthly"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-semibold">{t("monthly") || "Monthly"}</div>
              <div className="text-sm text-muted-foreground">
                ${process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE || "9.99"}/month
              </div>
            </button>

            <button
              onClick={() => setSelectedPlan("yearly")}
              className={`rounded-lg border-2 p-3 text-center transition-all ${
                selectedPlan === "yearly"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-semibold">{t("yearly") || "Yearly"}</div>
              <div className="text-sm text-muted-foreground">
                ${process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE || "89.99"}/year
              </div>
              <div className="mt-1 text-xs text-green-600">
                {t("save25") || "Save 25%"}
              </div>
            </button>
          </div>

          {/* Benefits list */}
          <div className="space-y-2 rounded-lg bg-muted/30 p-4">
            <div className="font-semibold text-sm">{t("premiumBenefits") || "With Pro:"}</div>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                {t("unlimitedPets") || "Unlimited Pets"}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                {t("unlimitedRecords") || "Unlimited Records"}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                {t("advancedFeatures") || "Advanced Features"}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                {t("prioritySupport") || "Priority Support"}
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={checkoutLoading}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={() => startCheckout(selectedPlan)}
            disabled={checkoutLoading}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            {checkoutLoading
              ? t("upgrading") || "Upgrading..."
              : `${t("upgrade") || "Upgrade"} to Pro`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
