/**
 * BillingCard Component
 * 
 * Displays subscription pricing comparison and active purchase buttons
 * Shows monthly vs yearly pricing with yearly as recommended option
 */

"use client"

import * as React from "react"
import { Check, CreditCard, Zap, Clock, AlertCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { usePremium } from "@/hooks/use-premium"
import { useI18n } from "@/lib/hooks/use-i18n"
import { cn } from "@/lib/utils"
import { useCardTransparency } from "@/lib/hooks/use-card-transparency"

const MONTHLY_PRICE = 9.50
const YEARLY_PRICE = 89.50
const YEARLY_MONTHLY_EQUIVALENT = (YEARLY_PRICE / 12).toFixed(2)
const SAVINGS_PERCENTAGE = Math.round((1 - YEARLY_PRICE / (MONTHLY_PRICE * 12)) * 100)

export function BillingCard() {
  const { t, language } = useI18n()
  const {
    tier,
    planType,
    subscriptionStatus,
    subscriptionEnd,
    loading,
    startCheckout,
    openBillingPortal,
    checkoutLoading,
  } = usePremium()

  const [selectedPlan, setSelectedPlan] = React.useState<"monthly" | "yearly">("yearly")

  const { cardClassName } = useCardTransparency();
  

  const isPro = tier === "pro"
  const isActive = subscriptionStatus === "active"

  const endDate = subscriptionEnd
    ? subscriptionEnd.toLocaleDateString(language === "es" ? "es-ES" : language === "ja" ? "ja-JP" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  if (loading) {
    return (
      <Card className={cardClassName}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {language === "es" ? "Facturación" : language === "ja" ? "請求" : "Billing"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <div className="space-y-1">
              <div className="font-medium">
                {t("verifyingSubscription") || (
                  language === "es"
                    ? "Verificando tu suscripción..."
                    : language === "ja"
                      ? "サブスクリプションを確認中..."
                      : "Verifying your subscription..."
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {language === "es"
                  ? "Esto puede tardar unos segundos"
                  : language === "ja"
                    ? "数秒かかる場合があります"
                    : "This may take a few seconds"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cardClassName}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {language === "es" ? "Facturación" : language === "ja" ? "請求" : "Billing"}
        </CardTitle>
        <CardDescription>
          {language === "es"
            ? "Gestiona tu plan y suscripción"
            : language === "ja"
              ? "プランとサブスクリプションを管理"
              : "Manage your plan and subscription"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="p-4 rounded-lg border bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-base">
                {isPro
                  ? language === "es"
                    ? "Plan Pro"
                    : language === "ja"
                      ? "Proプラン"
                      : "Pro Plan"
                  : language === "es"
                    ? "Plan Gratuito"
                    : language === "ja"
                      ? "無料プラン"
                      : "Free Plan"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {isPro ? (
                  <>
                    {planType === "monthly"
                      ? language === "es"
                        ? "Facturación mensual"
                        : language === "ja"
                          ? "月額請求"
                          : "Monthly billing"
                      : planType === "yearly"
                        ? language === "es"
                          ? "Facturación anual"
                          : language === "ja"
                            ? "年額請求"
                            : "Yearly billing"
                        : null}
                    {endDate && (
                      <>
                        {" • "}
                        {language === "es" ? "Renueva el" : language === "ja" ? "更新日" : "Renews"} {endDate}
                      </>
                    )}
                  </>
                ) : language === "es" ? (
                  "Plan básico con funcionalidades limitadas"
                ) : language === "ja" ? (
                  "基本プラン（機能制限あり）"
                ) : (
                  "Basic plan with limited features"
                )}
              </div>
            </div>
            <div className="text-right">
              {isPro && isActive ? (
                <Badge className="bg-green-600 hover:bg-green-700">
                  {language === "es" ? "Activo" : language === "ja" ? "アクティブ" : "Active"}
                </Badge>
              ) : isPro && subscriptionStatus === "past_due" ? (
                <Badge variant="destructive">
                  {language === "es" ? "Pago pendiente" : language === "ja" ? "支払い遅延" : "Past Due"}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {/* Warning for past due */}
        {subscriptionStatus === "past_due" && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900 dark:text-red-200">
                <div className="font-semibold mb-1">
                  {language === "es"
                    ? "Problema con el pago"
                    : language === "ja"
                      ? "支払いの問題"
                      : "Payment Issue"}
                </div>
                <p className="text-red-800 dark:text-red-300">
                  {language === "es"
                    ? "Tu método de pago falló. Por favor actualiza tu información de pago para continuar con las funciones premium."
                    : language === "ja"
                      ? "お支払いに失敗しました。プレミアム機能を継続するには、お支払い方法を更新してください。"
                      : "Your payment method failed. Please update your payment information to continue using premium features."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Manage Billing for Pro Users */}
        {isPro && (
          <>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button variant="outline" className="w-full" onClick={() => openBillingPortal("manage")}>
                <Clock className="h-4 w-4 mr-2" />
                {language === "es"
                  ? "Gestionar facturación"
                  : language === "ja"
                    ? "請求管理"
                    : "Manage Billing"}
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  const confirmed = window.confirm(
                    language === "es"
                      ? "Serás redirigido a Stripe para confirmar la cancelación de Pro."
                      : language === "ja"
                        ? "Proのキャンセル確認のため、Stripeに移動します。"
                        : "You will be redirected to Stripe to confirm Pro cancellation."
                  )

                  if (confirmed) {
                    openBillingPortal("cancel")
                  }
                }}
              >
                {language === "es"
                  ? "Cancelar Pro"
                  : language === "ja"
                    ? "Proをキャンセル"
                    : "Cancel Pro"}
              </Button>
            </div>
          </>
        )}

        {/* Pricing Comparison for Free Users */}
        {!isPro && (
          <>
            <Separator />

            {/* Pro Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <div className="text-sm font-semibold">
                  {language === "es"
                    ? "Características PRO"
                    : language === "ja"
                      ? "Pro機能"
                      : "PRO Features"}
                </div>
              </div>
              <ul className="grid gap-2 text-sm">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === "es"
                      ? "Categorías y proyectos ilimitados"
                      : language === "ja"
                        ? "無制限のカテゴリとプロジェクト"
                        : "Unlimited categories and projects"}
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === "es"
                      ? "Análisis avanzados y reportes"
                      : language === "ja"
                        ? "高度な分析とレポート"
                        : "Advanced analytics and reports"}
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === "es"
                      ? "Subtareas y dependencias ilimitadas"
                      : language === "ja"
                        ? "無制限のサブタスクと依存関係"
                        : "Unlimited subtasks and dependencies"}
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === "es"
                      ? "Cuadernos ilimitados"
                      : language === "ja"
                        ? "無制限のノートブック"
                        : "Unlimited notebooks"}
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === "es"
                      ? "Sesiones programadas y activas ilimitadas (Gratis: 5)"
                      : language === "ja"
                        ? "予定/進行中セッション無制限（無料プランは5件まで）"
                        : "Unlimited scheduled and active sessions (Free: 5)"}
                  </span>
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === "es"
                      ? "Soporte prioritario"
                      : language === "ja"
                        ? "優先サポート"
                        : "Priority support"}
                  </span>
                </li>
              </ul>
            </div>

            <Separator />

            {/* Plan Selection */}
            <div className="space-y-4">
              <div className="text-sm font-semibold text-center">
                {language === "es"
                  ? "Elige tu plan"
                  : language === "ja"
                    ? "プランを選択"
                    : "Choose your plan"}
              </div>

              {/* Monthly Option */}
              <button
                onClick={() => setSelectedPlan("monthly")}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all text-left",
                  selectedPlan === "monthly"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {language === "es" ? "Mensual" : language === "ja" ? "月額" : "Monthly"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es"
                        ? "Facturación mensual"
                        : language === "ja"
                          ? "毎月請求"
                          : "Billed monthly"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{MONTHLY_PRICE}€</div>
                    <div className="text-xs text-muted-foreground">
                      {language === "es" ? "/mes" : language === "ja" ? "/月" : "/month"}
                    </div>
                  </div>
                </div>
              </button>

              {/* Yearly Option - Recommended */}
              <button
                onClick={() => setSelectedPlan("yearly")}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all text-left relative",
                  selectedPlan === "yearly"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                {/* Recommended Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground font-semibold">
                    {language === "es"
                      ? "Recomendado"
                      : language === "ja"
                        ? "おすすめ"
                        : "Recommended"}
                  </Badge>
                </div>

                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {language === "es" ? "Anual" : language === "ja" ? "年額" : "Yearly"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === "es"
                        ? "Facturación anual"
                        : language === "ja"
                          ? "年次請求"
                          : "Billed yearly"}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        {language === "es"
                          ? `Ahorra ${SAVINGS_PERCENTAGE}%`
                          : language === "ja"
                            ? `${SAVINGS_PERCENTAGE}%お得`
                            : `Save ${SAVINGS_PERCENTAGE}%`}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{YEARLY_PRICE}€</div>
                    <div className="text-xs text-muted-foreground">
                      {language === "es" ? "/año" : language === "ja" ? "/年" : "/year"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ({YEARLY_MONTHLY_EQUIVALENT}€
                      {language === "es" ? "/mes" : language === "ja" ? "/月" : "/mo"})
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Upgrade Button */}
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => startCheckout(selectedPlan)}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {language === "es"
                    ? "Procesando..."
                    : language === "ja"
                      ? "処理中..."
                      : "Processing..."}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  {language === "es"
                    ? "Mejorar a PRO"
                    : language === "ja"
                      ? "Proにアップグレード"
                      : "Upgrade to PRO"}
                </>
              )}
            </Button>

            {/* Info text */}
            <p className="text-xs text-muted-foreground text-center">
              {language === "es"
                ? "Pago seguro procesado por Stripe. Cancela en cualquier momento."
                : language === "ja"
                  ? "Stripeによる安全な支払い処理。いつでもキャンセル可能。"
                  : "Secure payment powered by Stripe. Cancel anytime."}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
