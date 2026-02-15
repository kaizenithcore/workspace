"use client"

import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import { track } from "@vercel/analytics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useUser } from "@/lib/firebase/hooks"
import { useUserDocument } from "@/lib/hooks/use-user-document"
import { cn } from "@/lib/utils"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ProInterestFormProps {
  location?: string
  variant?: string
  className?: string
}

export function ProInterestForm({
  location = "dashboard",
  variant,
  className,
}: ProInterestFormProps) {
  const { t } = useI18n()
  const { user } = useUser()
  const { userDoc, loading: userLoading } = useUserDocument(user?.uid)
  const [email, setEmail] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Check if user already submitted
  const alreadySubmitted = userDoc?.proInterestSubmitted === true

  // Initialize email from user if available
  React.useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email)
    }
  }, [user?.email, email])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      setError(t("invalidEmail"))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/pro-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          context: {
            location,
            ...(variant ? { variant } : {}),
          },
        }),
      })

      const payload = await response.json().catch(() => null)

      if (response.ok) {
        setIsSuccess(true)
        
        // Mark in Firestore (client-side to avoid permission issues)
        if (user?.uid) {
          try {
            const { markProInterestSubmitted } = await import("@/lib/firestore-user")
            await markProInterestSubmitted(user.uid)
            console.log("[ProInterestForm] Marked in Firestore")
          } catch (err) {
            console.error("[ProInterestForm] Failed to mark Firestore:", err)
          }
        }
        
        try {
          track("pro_interest_submitted")
        } catch {
          // Ignore analytics failures
        }
        return
      }

      setError(payload?.message || t("error"))
    } catch {
      setError(t("error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking user
  if (userLoading) {
    return (
      <Card className={cn("border-primary/20", className)}>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </CardContent>
      </Card>
    )
  }

  // Show success if already submitted or just submitted
  if (isSuccess || alreadySubmitted) {
    return (
      <Card className={className}>
        <CardContent className="flex items-start gap-3 p-6">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <div className="space-y-1">
            <p className="font-semibold">{t("proInterest.successTitle")}</p>
            <p className="text-sm text-muted-foreground">
              {t("proInterest.successMessage")}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{t("proInterest.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("proInterest.subtitle")}
          </p>
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder={t("proInterest.emailPlaceholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? t("loading") : t("proInterest.submit")}
          </Button>
        </form>
        <div className="text-xs text-muted-foreground">
          <span>{t("proInterest.privacy")}</span>{" "}
          <span>{t("proInterest.privacyAuxText")}</span>
        </div>
      </CardContent>
    </Card>
  )
}
