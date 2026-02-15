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

const FEEDBACK_OPTIONS = [
  { value: "bug-report", label: "Reportar un error" },
  { value: "suggestion", label: "Sugerencia" },
  { value: "general-opinion", label: "Opinion general" },
  { value: "other", label: "Otro" },
]

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
      setErrorMessage("Cuentanos un poco mas para poder ayudarte mejor.")
      return
    }

    if (characterCount > MAX_MESSAGE_LENGTH) {
      setErrorMessage("El mensaje supera el limite de 500 caracteres.")
      return
    }

    if (!emailIsValid) {
      setErrorMessage("El email no parece valido.")
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
            : "No pudimos enviar tu feedback. Intentalo de nuevo."
        throw new Error(messageText)
      }

      setSuccessMessage("Gracias por ayudarnos a mejorar.")
      resetForm()
    } catch (error) {
      console.error("[EarlyAccessFeedbackWidget]", error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No pudimos enviar tu feedback. Intentalo de nuevo.",
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
            Early Access
          </Badge>
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-background shadow-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                Estamos en fase de pruebas
              </h2>
              <p className="text-sm text-muted-foreground">
                Esta herramienta esta en desarrollo activo. Tu feedback nos ayuda
                a mejorar mas rapido.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="feedback-type">Tipo de feedback</Label>
            <Select
              value={feedbackType}
              onValueChange={setFeedbackType}
            >
              <SelectTrigger id="feedback-type" className="w-full">
                <SelectValue placeholder="Selecciona una opcion" />
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
              <Label htmlFor="feedback-message">Mensaje</Label>
              <span className="text-xs text-muted-foreground">
                {characterCount}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Que estas viviendo? Un bug, una idea o cualquier opinion sirve."
              maxLength={MAX_MESSAGE_LENGTH}
              rows={5}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="feedback-email">Email (opcional)</Label>
            <Input
              id="feedback-email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (!event.target.value) {
                  setConsent(false)
                }
              }}
              placeholder="Tu email si quieres que te respondamos"
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
                  Acepto recibir actualizaciones sobre el progreso del proyecto.
                </Label>
                <p className="text-xs text-muted-foreground">
                  Si aceptas, enviaremos tu email a nuestra lista Early Access.
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
              Enviando feedback...
            </span>
          ) : (
            "Enviar feedback"
          )}
        </Button>
      </form>
    </div>
  )
}
