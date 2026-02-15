"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ProInterestForm } from "@/components/ProInterestForm"
import { useI18n } from "@/lib/hooks/use-i18n"

interface ProInterestModalProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  location?: string
  variant?: string
}

export function ProInterestModal({
  trigger,
  open,
  onOpenChange,
  location = "modal",
  variant,
}: ProInterestModalProps) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("proInterest.title")}</DialogTitle>
          <DialogDescription>{t("proInterest.subtitle")}</DialogDescription>
        </DialogHeader>
        <ProInterestForm location={location} variant={variant} />
      </DialogContent>
    </Dialog>
  )
}
