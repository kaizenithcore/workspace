"use client"

import * as React from "react"
import { X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useUser } from "@/lib/firebase/hooks"
import { useUserDocument } from "@/lib/hooks/use-user-document"

interface ProBannerProps {
  className?: string
  feature?: string
  onDismiss?: () => void
  onUpgrade?: () => void
}

export function ProBanner({ className, feature = "this feature", onDismiss, onUpgrade }: ProBannerProps) {
  const { t } = useI18n()
  const [dismissed, setDismissed] = React.useState(false)
  const { user } = useUser()
  const { userDoc } = useUserDocument(user?.uid)

  // Don't show banner if user has Individual plan and is active
  const isPro = userDoc?.subscription.plan === "individual" && userDoc?.subscription.status === "active"
  
  if (dismissed || isPro) return null

  const unlockText = t("unlockWithPro").replace("{feature}", feature)

  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-4 rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border border-primary/20 kz-modal-enter",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 kz-pulse-glow">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{unlockText}</p>
          <p className="text-xs text-muted-foreground">{t("proTrialCta")}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onUpgrade} className="bg-primary hover:bg-primary/90 kz-lift kz-shimmer">
          {t("startTrial")}
        </Button>
        <button
          onClick={() => {
            setDismissed(true)
            onDismiss?.()
          }}
          className="p-1 rounded-full hover:bg-muted transition-colors"
          aria-label={t("dismiss")}
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
