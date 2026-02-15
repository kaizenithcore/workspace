"use client"

import * as React from "react"
import { MessageSquare, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/hooks/use-i18n"

const MAX_MESSAGE_LENGTH = 500

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface EarlyAccessFeedbackWidgetProps {
  pageContext?: string
  className?: string
}

export function EarlyAccessFeedbackWidget({
  pageContext,
  className,
}: EarlyAccessFeedbackWidgetProps) {
  const { t } = useI18n()
  
  const FEEDBACK_OPTIONS = [
    { value: "bug-report", label: t("feedbackBugReport") },
    { value: "suggestion", label: t("feedbackSuggestion") },
    { value: "general-opinion", label: t("feedbackGeneralOpinion") },
    { value: "other", label: t("feedbackOther") },
  ]
  
  const [feedbackType, setFeedbackType] = React.useState<string>(
    FEEDBACK_OPTIONS[0].value,
  )
  const [message, setMessage] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [consent, setConsent] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  )
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const trimmedEmail = email.trim()
  const trimmedMessage = message.trim()
  const emailIsValid = trimmedEmail.length === 0 || emailRegex.test(trimmedEmail)

  const characterCount = trimmedMessage.length

  const resetForm = () => {
    setFeedbackType(FEEDBACK_OPTIONS[0].value)
    setMessage("")
    setEmail("")
    setConsent(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!trimmedMessage) {
      setErrorMessage(t("feedbackErrorEmpty"))
      return
    }

    if (characterCount > MAX_MESSAGE_LENGTH) {
      setErrorMessage(t("feedbackErrorTooLong"))
      return
    }

    if (!emailIsValid) {
      setErrorMessage(t("feedbackErrorInvalidEmail"))
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: feedbackType,
          message: trimmedMessage,
          email: trimmedEmail || null,
          consent,
          pageContext: pageContext || null,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const messageText =
          payload && typeof payload.message === "string"
            ? payload.message
            : t("feedbackErrorGeneric")
        throw new Error(messageText)
      }

      setSuccessMessage(t("feedbackSuccess"))
      resetForm()
    } catch (error) {
      console.error("[EarlyAccessFeedbackWidget]", error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("feedbackErrorGeneric"),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const showConsent = trimmedEmail.length > 0

  return (
    <div
      className={cn(
        "w-full max-w-[640px] rounded-2xl border bg-muted/40 shadow-sm",
        "backdrop-blur-sm transition-shadow",
        className,
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
        <div className="flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit">
            {t("feedbackEarlyAccessBadge")}
          </Badge>
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-background shadow-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                {t("feedbackTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("feedbackDescription")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="feedback-type">{t("feedbackType")}</Label>
            <Select
              value={feedbackType}
              onValueChange={setFeedbackType}
            >
              <SelectTrigger id="feedback-type" className="w-full">
                <SelectValue placeholder={t("feedbackTypePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="feedback-message">{t("feedbackMessage")}</Label>
              <span className="text-xs text-muted-foreground">
                {characterCount}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t("feedbackMessagePlaceholder")}
              maxLength={MAX_MESSAGE_LENGTH}
              rows={5}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="feedback-email">{t("feedbackEmail")}</Label>
            <Input
              id="feedback-email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (!event.target.value) {
                  setConsent(false)
                }
              }}
              placeholder={t("feedbackEmailPlaceholder")}
              type="email"
              autoComplete="email"
            />
          </div>

          {showConsent && (
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-border/60 bg-background/70 p-3">
              <Checkbox
                id="feedback-consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(Boolean(checked))}
              />
              <div className="grid gap-1">
                <Label htmlFor="feedback-consent" className="text-sm">
                  {t("feedbackConsent")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("feedbackConsentDescription")}
                </p>
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
        {successMessage && (
          <p className="text-sm text-foreground">{successMessage}</p>
        )}

        <Button
          type="submit"
          className="w-full transition hover:shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("feedbackSubmitting")}
            </span>
          ) : (
            t("feedbackSubmit")
          )}
        </Button>
      </form>
    </div>
  )
}
