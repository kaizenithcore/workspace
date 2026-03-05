/**
 * SubscriptionStatus Component
 * 
 * Displays user's current subscription status
 * Shows upgrade button if free, billing portal if pro
 */

"use client"

import * as React from "react"
import { AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePremium } from "@/hooks/use-premium"
import { useI18n } from "@/lib/hooks/use-i18n"

export function SubscriptionStatus() {
  const { t } = useI18n()
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("subscription") || "Subscription"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">{t("loading") || "Loading..."}</div>
        </CardContent>
      </Card>
    )
  }

  const isPremium = tier === "pro"
  const endDate = subscriptionEnd
    ? subscriptionEnd.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isPremium ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              {t("proSubscription") || "Pro Subscription"}
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-amber-500" />
              {t("freeAccount") || "Free Account"}
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isPremium
            ? t("youArePro") || "You have access to all premium features"
            : t("upgradeToPro") || "Upgrade to unlock unlimited features"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status info */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("plan") || "Plan"}:</span>
            <span className="font-semibold capitalize">{tier}</span>
          </div>

          {isPremium && planType !== "free" && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("planType") || "Plan Type"}:</span>
                <span className="font-semibold capitalize">{planType}</span>
              </div>

              {subscriptionStatus && subscriptionStatus !== "none" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("status") || "Status"}:</span>
                  <span className="font-semibold capitalize">
                    {subscriptionStatus === "active" && (
                      <span className="text-green-600">{t("active") || "Active"}</span>
                    )}
                    {subscriptionStatus === "past_due" && (
                      <span className="text-red-600">{t("pastDue") || "Past Due"}</span>
                    )}
                    {subscriptionStatus === "canceled" && (
                      <span className="text-gray-600">{t("canceled") || "Canceled"}</span>
                    )}
                    {!["active", "past_due", "canceled"].includes(subscriptionStatus) && (
                      <span className="text-gray-600 capitalize">{subscriptionStatus}</span>
                    )}
                  </span>
                </div>
              )}

              {endDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("renewsOn") || "Renews On"}:</span>
                  <span className="font-semibold">{endDate}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Features when pro */}
        {isPremium && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 space-y-2">
            <h4 className="font-semibold text-green-900 dark:text-green-100">
              {t("premiumFeatures") || "Premium Features"}
            </h4>
            <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
              <li>✓ {t("unlimitedPets") || "Unlimited Pets"}</li>
              <li>✓ {t("unlimitedRecords") || "Unlimited Records"}</li>
              <li>✓ {t("advancedFeatures") || "Advanced Features"}</li>
              <li>✓ {t("prioritySupport") || "Priority Support"}</li>
            </ul>
          </div>
        )}

        {/* Warning for past due */}
        {subscriptionStatus === "past_due" && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              {t("paymentFailed") ||
                "Payment failed. Please update your payment method to continue using premium features."}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {isPremium ? (
            <>
              <Button variant="outline" className="flex-1" onClick={openBillingPortal}>
                <Clock className="h-4 w-4 mr-2" />
                {t("manageBilling") || "Manage Billing"}
              </Button>
              {subscriptionStatus === "past_due" && (
                <Button className="flex-1" onClick={openBillingPortal}>
                  {t("updatePayment") || "Update Payment"}
                </Button>
              )}
            </>
          ) : (
            <Button className="w-full" onClick={() => startCheckout("monthly")} disabled={checkoutLoading}>
              {checkoutLoading
                ? t("upgrading") || "Upgrading..."
                : `${t("upgradeToPro") || "Upgrade"} now`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
