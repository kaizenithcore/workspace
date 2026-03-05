/**
 * ThankYouModal Component
 * 
 * Shows a thank you message after successful Pro subscription purchase
 */

"use client"

import * as React from "react"
import { CheckCircle2, Sparkles, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/hooks/use-i18n"

interface ThankYouModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ThankYouModal({ open, onOpenChange }: ThankYouModalProps) {
  const { t, language } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-green-100 dark:bg-green-900/30 rounded-full p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <DialogTitle className="text-2xl font-bold">
              {t("proThankYouTitle") || (
                language === "es"
                  ? "¡Bienvenido a Pro!"
                  : language === "ja"
                    ? "Proへようこそ！"
                    : "Welcome to Pro!"
              )}
            </DialogTitle>
            
            <DialogDescription className="text-base space-y-3">
              <p>
                {t("proThankYouMessage") || (
                  language === "es"
                    ? "Gracias por unirte a KAIZENITH Pro. Ahora tienes acceso a todas las funcionalidades premium."
                    : language === "ja"
                      ? "KAIZENITH Proにご参加いただきありがとうございます。すべてのプレミアム機能にアクセスできるようになりました。"
                      : "Thank you for joining KAIZENITH Pro. You now have access to all premium features."
                )}
              </p>
              
              <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {t("proThankYouFeaturesTitle") || (
                      language === "es"
                        ? "Ya disponible"
                        : language === "ja"
                          ? "利用可能"
                          : "Now available"
                    )}
                  </span>
                </div>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li>
                    ✓ {language === "es"
                      ? "Categorías y proyectos ilimitados"
                      : language === "ja"
                        ? "無制限のカテゴリとプロジェクト"
                        : "Unlimited categories and projects"}
                  </li>
                  <li>
                    ✓ {language === "es"
                      ? "Análisis avanzados y reportes"
                      : language === "ja"
                        ? "高度な分析とレポート"
                        : "Advanced analytics and reports"}
                  </li>
                  <li>
                    ✓ {language === "es"
                      ? "Subtareas y dependencias ilimitadas"
                      : language === "ja"
                        ? "無制限のサブタスクと依存関係"
                        : "Unlimited subtasks and dependencies"}
                  </li>
                  <li>
                    ✓ {language === "es"
                      ? "Sesiones ilimitadas"
                      : language === "ja"
                        ? "無制限のセッション"
                        : "Unlimited sessions"}
                  </li>
                  <li>
                    ✓ {language === "es"
                      ? "Soporte prioritario"
                      : language === "ja"
                        ? "優先サポート"
                        : "Priority support"}
                  </li>
                </ul>
              </div>
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="flex justify-center pt-2">
          <Button onClick={() => onOpenChange(false)} size="lg" className="min-w-[200px]">
            {t("getStarted") || (
              language === "es"
                ? "¡Empezar!"
                : language === "ja"
                  ? "始める"
                  : "Get Started"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
