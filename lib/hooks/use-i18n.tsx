"use client"

import * as React from "react"
import { translations, type Language, type TranslationKey } from "@/lib/i18n/translations"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { useUser } from "@/lib/firebase/hooks"
import { useUserDocument } from "@/lib/hooks/use-user-document"
import { updateUserPreferences } from "@/lib/firestore-user"

interface I18nContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const I18nContext = React.createContext<I18nContextValue | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const { userDoc, loading } = useUserDocument(user?.uid)

  const [storedLanguage, setStoredLanguage] =
    useLocalStorage<Language>("focusflow-language", "en")

  const [language, setLanguage] = React.useState<Language>("en")

  /**
   * 🔹 Resolver idioma
   * - Si hay usuario → Firestore es la fuente de verdad
   * - Si no hay usuario → localStorage
   */
  React.useEffect(() => {
    if (loading) return

    if (user?.uid) {
      const remoteLang = userDoc?.preferences?.language ?? "en"
      console.log("[i18n] Using Firestore language:", remoteLang)
      setLanguage(remoteLang)
    } else {
      console.log("[i18n] Using localStorage language:", storedLanguage)
      setLanguage(storedLanguage)
    }
  }, [user?.uid, userDoc?.preferences?.language, loading])

  /**
   * 🔹 Cambio manual
   */
  const changeLanguage = React.useCallback(
    async (lang: Language) => {
      if (lang === language) return

      console.log("[i18n] Manual change to:", lang)

      setLanguage(lang)

      if (user?.uid) {
        console.log("[i18n] Writing to Firestore:", lang)
        await updateUserPreferences(user.uid, { language: lang })
      } else {
        console.log("[i18n] Writing to localStorage:", lang)
        setStoredLanguage(lang)
      }
    },
    [language, user?.uid, setStoredLanguage],
  )

  const t = React.useCallback(
    (key: TranslationKey): string =>
      translations[language]?.[key] ?? translations.en[key] ?? key,
    [language],
  )

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}



export function useI18n() {
  const context = React.useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
