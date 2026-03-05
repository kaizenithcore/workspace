/**
 * Example: Settings / Billing Page
 * 
 * Add this to your app/settings pages to show subscription status
 * and provide billing management options
 */

"use client"

import React from "react"
import { SubscriptionStatus } from "@/components/premium/subscription-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/hooks/use-i18n"

export default function SettingsBillingPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("billing") || "Billing & Subscription"}</h1>
        <p className="text-muted-foreground mt-2">
          {t("manageSubscription") || "Manage your subscription and billing information"}
        </p>
      </div>

      {/* Current Subscription Status */}
      <SubscriptionStatus />

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("billingInfo") || "Billing Information"}</CardTitle>
          <CardDescription>
            {t("billingInfoDesc") || "Your billing details and payment method are managed securely by Stripe"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-sm text-blue-900 dark:text-blue-200">
              <p>
                {t("billingSecure") ||
                  "All payment information is securely processed and stored by Stripe. We never see your full card details."}
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                {t("billingInvoices") ||
                  "Invoices and billing history are available in the Stripe billing portal. You can access it from your subscription status above."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("faq") || "Frequently Asked Questions"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-1">{t("howToCancel") || "How do I cancel my subscription?"}</h4>
            <p className="text-sm text-muted-foreground">
              {t("howToCancelAnswer") ||
                "You can cancel anytime from the Stripe billing portal. Your access will continue until the end of your billing period."}
            </p>
          </div>

          <hr />

          <div>
            <h4 className="font-semibold text-sm mb-1">{t("refunds") || "What's your refund policy?"}</h4>
            <p className="text-sm text-muted-foreground">
              {t("refundsAnswer") ||
                "We offer 30-day money-back guarantee. Contact support within 30 days of purchase for a full refund."}
            </p>
          </div>

          <hr />

          <div>
            <h4 className="font-semibold text-sm mb-1">
              {t("changePlan") || "Can I change my plan?"}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("changePlanAnswer") ||
                "Yes! You can upgrade or downgrade anytime from the Stripe billing portal. Changes take effect at your next billing cycle."}
            </p>
          </div>

          <hr />

          <div>
            <h4 className="font-semibold text-sm mb-1">{t("support") || "Need help?"}</h4>
            <p className="text-sm text-muted-foreground">
              {t("supportAnswer") ||
                "Contact our support team: support@example.com or use the chat widget in the app."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("proFeatures") || "Pro Features"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("proFeaturesDesc") ||
              "With a Pro subscription, you get access to:"}
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <span className="text-primary mt-1">✓</span>
              <div>
                <h4 className="text-sm font-semibold">{t("unlimitedPets") || "Unlimited Pets"}</h4>
                <p className="text-xs text-muted-foreground">
                  {t("unlimitedPetsDesc") || "Add as many pets as you want"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-primary mt-1">✓</span>
              <div>
                <h4 className="text-sm font-semibold">{t("unlimitedRecords") || "Unlimited Records"}</h4>
                <p className="text-xs text-muted-foreground">
                  {t("unlimitedRecordsDesc") || "Track unlimited health records"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-primary mt-1">✓</span>
              <div>
                <h4 className="text-sm font-semibold">{t("advancedAnalytics") || "Advanced Analytics"}</h4>
                <p className="text-xs text-muted-foreground">
                  {t("advancedAnalyticsDesc") || "Detailed health insights and reports"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-primary mt-1">✓</span>
              <div>
                <h4 className="text-sm font-semibold">{t("prioritySupport") || "Priority Support"}</h4>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-primary mt-1">✓</span>
              <div>
                <h4 className="text-sm font-semibold">{t("allFeatures") || "All Features"}</h4>
                <p className="text-xs text-muted-foreground">
                  {t("allFeaturesDesc") || "Access to all current and future features"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-primary mt-1">✓</span>
              <div>
                <h4 className="text-sm font-semibold">{t("monthlyAndYearly") || "Monthly & Yearly Options"}</h4>
                <p className="text-xs text-muted-foreground">
                  {t("monthlyAndYearlyDesc") || "Choose the billing cycle that works for you"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
