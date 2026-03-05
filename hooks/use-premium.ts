/**
 * usePremium Hook
 * 
 * Manages subscription state and provides methods for premium features
 * - Check subscription status on mount
 * - Use webhook-driven state as source of truth with low-frequency fallback refresh
 * - Initiate checkout
 * - Open billing portal
 * - Provide feature limits based on plan
 */

"use client"

import * as React from "react"
import { useUser } from "@/lib/firebase/hooks"
import { useUserDocument } from "@/lib/hooks/use-user-document"
import { useToast } from "@/hooks/use-toast"

// Feature limits by plan
const FEATURE_LIMITS = {
  free: {
    maxPets: 1,
    maxRecordsPerCategory: 10,
    maxProjectsPerGroup: 3,
  },
  pro: {
    maxPets: Infinity,
    maxRecordsPerCategory: Infinity,
    maxProjectsPerGroup: Infinity,
  },
}

export interface PremiumState {
  // Subscription info
  tier: "free" | "pro"
  planType: "free" | "monthly" | "yearly"
  subscriptionStatus: string
  subscriptionEnd: Date | null
  stripeCustomerId?: string

  // Loading states
  loading: boolean
  checkoutLoading: boolean
  portalLoading: boolean

  // Computed values
  isPremium: boolean
  canAddPet: (currentCount: number) => boolean
  canAddRecord: (category: string, currentCount: number) => boolean

  // Actions
  startCheckout: (plan: "monthly" | "yearly") => Promise<void>
  openBillingPortal: (flow?: "manage" | "cancel") => Promise<void>
  refreshSubscription: () => Promise<void>
}

export function usePremium(): PremiumState {
  const { user } = useUser()
  const { userDoc } = useUserDocument(user?.uid)
  const { toast } = useToast()

  const [tier, setTier] = React.useState<"free" | "pro">("free")
  const [planType, setPlanType] = React.useState<"free" | "monthly" | "yearly">("free")
  const [subscriptionStatus, setSubscriptionStatus] = React.useState("none")
  const [subscriptionEnd, setSubscriptionEnd] = React.useState<Date | null>(null)
  const [stripeCustomerId, setStripeCustomerId] = React.useState<string>()
  const [loading, setLoading] = React.useState(true)
  const [checkoutLoading, setCheckoutLoading] = React.useState(false)
  const [portalLoading, setPortalLoading] = React.useState(false)

  const isPremium = tier === "pro"

  // Local fallback from Firestore user document (covers legacy premium users without Stripe metadata)
  React.useEffect(() => {
    if (!userDoc?.subscription) return

    const sub = userDoc.subscription
    const isLegacyOrProActive =
      sub.status === "active" && (sub.plan === "individual" || sub.plan === "pro")

    if (isLegacyOrProActive) {
      setTier("pro")
      setSubscriptionStatus(sub.subscriptionStatus || "active")
      if (sub.planType === "yearly") {
        setPlanType("yearly")
      } else if (sub.planType === "monthly") {
        setPlanType("monthly")
      } else {
        setPlanType("monthly")
      }
    }
  }, [userDoc])

  // Check subscription status
  const checkSubscription = React.useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/stripe/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("[usePremium] Check subscription error:", error)
        setLoading(false)
        return
      }

      const data = await response.json()
      
      setTier(data.tier || "free")
      setPlanType(data.planType || "free")
      setSubscriptionStatus(data.subscriptionStatus || "none")
      if (data.subscriptionEnd) {
        setSubscriptionEnd(new Date(data.subscriptionEnd))
      }
      if (data.stripeCustomerId) {
        setStripeCustomerId(data.stripeCustomerId)
      }
    } catch (error) {
      console.error("[usePremium] Error checking subscription:", error)
      // Fail silently, keep as free
    } finally {
      setLoading(false)
    }
  }, [user])

  // Check subscription on mount
  React.useEffect(() => {
    checkSubscription()
  }, [user?.uid, checkSubscription])

  // Low-frequency fallback refresh. Primary sync comes from Stripe webhooks.
  React.useEffect(() => {
    if (!user?.uid) return

    const interval = setInterval(() => {
      checkSubscription()
    }, 30 * 60 * 1000)

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSubscription()
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [checkSubscription, user?.uid])

  // Start checkout
  const startCheckout = React.useCallback(
    async (plan: "monthly" | "yearly") => {
      if (!user?.email) {
        toast({
          title: "Error",
          description: "User email not found",
          variant: "destructive",
        })
        return
      }

      setCheckoutLoading(true)
      try {
        const priceId =
          plan === "monthly"
            ? process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID
            : process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID

        if (!priceId) {
          throw new Error(`Price ID not configured for ${plan} plan`)
        }

        const response = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priceId,
            userId: user.uid,
            userEmail: user.email,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to create checkout session")
        }

        // Redirect to Stripe checkout
        if (data.url) {
          window.location.href = data.url
        } else {
          throw new Error("No checkout URL returned")
        }
      } catch (error) {
        console.error("[usePremium] Checkout error:", error)
        toast({
          title: "Checkout Error",
          description: error instanceof Error ? error.message : "Failed to start checkout",
          variant: "destructive",
        })
      } finally {
        setCheckoutLoading(false)
      }
    },
    [user, toast]
  )

  // Open billing portal
  const openBillingPortal = React.useCallback(async (flow: "manage" | "cancel" = "manage") => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "User email not found",
        variant: "destructive",
      })
      return
    }

    setPortalLoading(true)
    try {
      const response = await fetch("/api/stripe/create-billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          flow,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create billing portal session")
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("[usePremium] Billing portal error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open billing portal",
        variant: "destructive",
      })
    } finally {
      setPortalLoading(false)
    }
  }, [user, toast])

  // Check if can add pet
  const canAddPet = React.useCallback((currentCount: number) => {
    const limit = isPremium ? FEATURE_LIMITS.pro.maxPets : FEATURE_LIMITS.free.maxPets
    return currentCount < limit
  }, [isPremium])

  // Check if can add record
  const canAddRecord = React.useCallback(
    (category: string, currentCount: number) => {
      const limit = isPremium
        ? FEATURE_LIMITS.pro.maxRecordsPerCategory
        : FEATURE_LIMITS.free.maxRecordsPerCategory
      return currentCount < limit
    },
    [isPremium]
  )

  return {
    tier,
    planType,
    subscriptionStatus,
    subscriptionEnd,
    stripeCustomerId,
    loading,
    checkoutLoading,
    portalLoading,
    isPremium,
    canAddPet,
    canAddRecord,
    startCheckout,
    openBillingPortal,
    refreshSubscription: checkSubscription,
  }
}
