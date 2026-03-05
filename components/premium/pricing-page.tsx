/**
 * PricingPage Component
 * 
 * Displays available plans with pricing and feature comparison
 * Allows users to upgrade directly
 */

"use client"

import * as React from "react"
import { Check, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePremium } from "@/hooks/use-premium"
import { useI18n } from "@/lib/hooks/use-i18n"

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      { name: "1 Pet", included: true },
      { name: "10 Records per Category", included: true },
      { name: "Basic Features", included: true },
      { name: "Unlimited Projects", included: false },
      { name: "Priority Support", included: false },
      { name: "Advanced Analytics", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 9.99,
    yearlyPrice: 89.99,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || "price_xxx",
    yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || "price_yyy",
    description: "For power users who want everything",
    features: [
      { name: "Unlimited Pets", included: true },
      { name: "Unlimited Records", included: true },
      { name: "All Features", included: true },
      { name: "Unlimited Projects", included: true },
      { name: "Priority Support", included: true },
      { name: "Advanced Analytics", included: true },
    ],
    highlighted: true,
  },
]

export function PricingPage() {
  const { t } = useI18n()
  const { tier, startCheckout, checkoutLoading } = usePremium()
  const [billingPeriod, setBillingPeriod] = React.useState<"monthly" | "yearly">("monthly")

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t("pricing") || "Simple, Transparent Pricing"}</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t("chooseYourPlan") || "Choose the plan that works best for you"}
        </p>
      </div>

      {/* Billing period selector */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setBillingPeriod("monthly")}
          className={`rounded-lg px-4 py-2 font-semibold transition-all ${
            billingPeriod === "monthly"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("monthly") || "Monthly"}
        </button>
        <button
          onClick={() => setBillingPeriod("yearly")}
          className={`rounded-lg px-4 py-2 font-semibold transition-all ${
            billingPeriod === "yearly"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("yearly") || "Yearly"}
          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            {t("save25") || "Save 25%"}
          </span>
        </button>
      </div>

      {/* Plans grid */}
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-4">
        {PLANS.map((plan) => {
          const isCurrent = tier === plan.id
          const isProMonthly = plan.id === "pro" && billingPeriod === "monthly"
          const isProYearly = plan.id === "pro" && billingPeriod === "yearly"

          return (
            <Card
              key={plan.id}
              className={`relative transition-all ${
                plan.highlighted ? "border-primary/50 shadow-lg lg:scale-105" : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    {t("mostPopular") || "Most Popular"}
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>

                <div className="mt-4">
                  {plan.id === "free" ? (
                    <div className="text-4xl font-bold">${plan.price}</div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold">
                        {billingPeriod === "monthly" ? `$${plan.monthlyPrice}` : `$${plan.yearlyPrice}`}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {billingPeriod === "monthly" ? t("perMonth") : t("perYear")}
                      </p>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features list */}
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <div className="h-5 w-5 rounded border border-border flex-shrink-0" />
                      )}
                      <span
                        className={
                          feature.included ? "text-foreground" : "text-muted-foreground line-through"
                        }
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {plan.id === "free" ? (
                  <Button variant="outline" className="w-full" disabled={isCurrent}>
                    {isCurrent ? t("currentPlan") || "Current Plan" : t("yourCurrentPlan") || "Your Current Plan"}
                  </Button>
                ) : (
                  <Button
                    className="w-full gap-2"
                    onClick={() => startCheckout(billingPeriod as "monthly" | "yearly")}
                    disabled={checkoutLoading || isCurrent}
                  >
                    <Zap className="h-4 w-4" />
                    {checkoutLoading
                      ? t("processing") || "Processing..."
                      : isCurrent
                        ? t("yourCurrentPlan") || "Your Current Plan"
                        : t("upgradeToPro") || "Upgrade to Pro"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* FAQ or additional info */}
      <div className="rounded-lg bg-muted/30 p-6 text-center">
        <h3 className="font-semibold mb-2">{t("questions") || "Have questions?"}</h3>
        <p className="text-muted-foreground">
          {t("contactSupport") || "Contact our support team for more information about our plans."}
        </p>
      </div>
    </div>
  )
}
