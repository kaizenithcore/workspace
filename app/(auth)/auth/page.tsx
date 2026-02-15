"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
} from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/config"


type AuthMode = "login" | "signup"

const GUEST_ACCESS_KEY = "kaizenith-guest-access-allowed"

interface FieldError {
  email?: string
  password?: string
  confirmPassword?: string
}

export default function AuthPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [, setGuestAccessAllowed] = useLocalStorage<boolean>(
    GUEST_ACCESS_KEY,
    false,
  )

  const [mode, setMode] = React.useState<AuthMode>("login")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isGuestLoading, setIsGuestLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  // Form state
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [name, setName] = React.useState("")

  // Validation
  const [errors, setErrors] = React.useState<FieldError>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [submitted, setSubmitted] = React.useState(false)

  // Refs for autofocus
  const emailRef = React.useRef<HTMLInputElement>(null)

  // Autofocus first input on mode change
  React.useEffect(() => {
    emailRef.current?.focus()
  }, [mode])

  // Clear errors when switching modes
  React.useEffect(() => {
    setErrors({})
    setFormError(null)
    setSubmitted(false)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }, [mode])

  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) return t("fieldRequired")
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) return t("invalidEmail")
    return undefined
  }

  const validatePassword = (value: string): string | undefined => {
    if (!value) return t("fieldRequired")
    if (value.length < 6) return t("passwordTooShort")
    return undefined
  }

  const validateConfirmPassword = (value: string): string | undefined => {
    if (!value) return t("fieldRequired")
    if (value !== password) return t("passwordMismatch")
    return undefined
  }

  const validate = (): boolean => {
    const newErrors: FieldError = {}
    newErrors.email = validateEmail(email)
    newErrors.password = validatePassword(password)
    if (mode === "signup") {
      newErrors.confirmPassword = validateConfirmPassword(confirmPassword)
    }
    setErrors(newErrors)
    return !newErrors.email && !newErrors.password && !newErrors.confirmPassword
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setSubmitted(true)
  setFormError(null)

  if (!validate()) return

  setIsLoading(true)

  try {
    if (mode === "login") {
      /* LOGIN */
      await signInWithEmailAndPassword(auth, email, password)
    } else {
      /* SIGN UP */
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

      const user = credential.user

      /* Create Firestore user document */
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: name.trim() || null,
        createdAt: serverTimestamp(),

        subscription: {
          plan: "free",
          status: "active",
        },

        preferences: {
          language: "en",
          theme: "system",
          cardTransparency: false,
        },
      })
    }

    setGuestAccessAllowed(false)
    router.push("/")
  } catch (error: any) {
    console.error(error)

    /* Firebase error mapping (básico pero correcto) */
    switch (error.code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
        setFormError(t("invalidCredentials"))
        break
      case "auth/email-already-in-use":
        setFormError(t("emailAlreadyInUse"))
        break
      case "auth/weak-password":
        setFormError(t("passwordTooShort"))
        break
      default:
        setFormError(t("authErrorGeneric"))
    }
  } finally {
    setIsLoading(false)
  }
}

  const handleGuestLogin = async () => {
    setFormError(null)
    setIsGuestLoading(true)
    try {
      await signInAnonymously(auth)
      setGuestAccessAllowed(true)
      router.push("/")
    } catch (error: any) {
      console.error(error)
      setFormError(t("authErrorGeneric"))
    } finally {
      setIsGuestLoading(false)
    }
  }


  // Show inline validation on blur once the form has been submitted once
  const blurValidate = (field: keyof FieldError) => {
    if (!submitted) return
    setErrors((prev) => ({
      ...prev,
      [field]:
        field === "email"
          ? validateEmail(email)
          : field === "password"
            ? validatePassword(password)
            : validateConfirmPassword(confirmPassword),
    }))
  }

  const PasswordToggle = ({
    visible,
    onToggle,
  }: {
    visible: boolean
    onToggle: () => void
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground bg-transparent"
      onClick={onToggle}
      tabIndex={-1}
      aria-label={visible ? t("hidePassword") : t("showPassword")}
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </Button>
  )

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center pb-2">
        {/* Kaizenith monogram */}
        <div className="flex justify-center mb-4">
          <svg
            width="40"
            height="46"
            viewBox="0 0 28 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M14 0L27 8V24L14 32L1 24V8L14 0Z"
              className="fill-primary"
            />
            <path
              d="M9 22V10L19 22V10"
              className="stroke-primary-foreground"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <CardTitle className="text-2xl tracking-brand">
          {t("welcomeToKaizenith")}
        </CardTitle>
        <CardDescription>{t("unifiedProductivityWorkspace")}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4 pt-4">
          {/* Name -- only on signup */}
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="auth-name">{t("nameLabel")}</Label>
              <Input
                id="auth-name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="auth-email">{t("emailLabel")}</Label>
            <Input
              ref={emailRef}
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => blurValidate("email")}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              required
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auth-password">{t("passwordLabel")}</Label>
              {mode === "login" && (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  tabIndex={-1}
                >
                  {t("forgotPassword")}
                </button>
              )}
            </div>
            <div className="relative space-y-2">
              <Input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                placeholder="--------"
                className="pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => blurValidate("password")}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                required
                minLength={6}
              />
              <PasswordToggle
                visible={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm password -- only on signup */}
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="auth-confirm-password">
                {t("confirmPasswordLabel")}
              </Label>
              <div className="relative space-y-2">
                <Input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="--------"
                  className="pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => blurValidate("confirmPassword")}
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword ? "confirm-password-error" : undefined
                  }
                  required
                  minLength={6}
                />
                <PasswordToggle
                  visible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((v) => !v)}
                />
              </div>
              {errors.confirmPassword && (
                <p
                  id="confirm-password-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Global form error */}
          {formError && (
            <p className="text-sm text-destructive text-center" role="alert">
              {formError}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full kz-lift"
            disabled={isLoading || isGuestLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "login" ? t("signingIn") : t("creatingAccount")}
              </>
            ) : mode === "login" ? (
              t("signIn")
            ) : (
              t("createAccount")
            )}
          </Button>

          {mode === "login" && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGuestLogin}
                disabled={isLoading || isGuestLoading}
              >
                {isGuestLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("enteringAsGuest")}
                  </>
                ) : (
                  t("continueAsGuest")
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {t("guestWarning")}
              </p>
            </div>
          )}

          {/* Switch mode link */}
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? t("noAccountYet") : t("alreadyHaveAccount")}{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? t("signUp") : t("login")}
            </button>
          </p>
        </CardFooter>
      </form>

      {/* Social auth divider */}
      <div className="px-6 pb-6">
        <div className="relative my-2">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            {t("orContinueWith")}
          </span>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2 mt-4 bg-transparent"
          disabled
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {t("googleComingSoon")}
        </Button>
      </div>
    </Card>
  )
}
