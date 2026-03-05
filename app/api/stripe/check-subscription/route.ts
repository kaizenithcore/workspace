// Check Subscription Status API Route
// Verifies current subscription status and updates Firestore

import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getAdminUserDocument, updateAdminUserSubscription } from "@/lib/firebase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

interface CheckSubscriptionResponse {
  subscribed: boolean
  tier: "free" | "pro"
  planType: "free" | "monthly" | "yearly"
  subscriptionStatus: string
  subscriptionEnd?: string
  stripeCustomerId?: string
}

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail } = await request.json()

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Missing userId or userEmail" },
        { status: 400 }
      )
    }

    let userDoc: any = null
    let adminAvailable = true

    // Get user from Firestore when Admin credentials are available.
    try {
      userDoc = await getAdminUserDocument(userId)
    } catch (adminError) {
      adminAvailable = false
      console.warn("[Stripe] Admin unavailable in check-subscription route:", adminError)
    }

    if (adminAvailable && !userDoc) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    let response: CheckSubscriptionResponse = {
      subscribed: false,
      tier: "free",
      planType: "free",
      subscriptionStatus: "none",
    }

    // Legacy fallback: existing paid users may have plan="individual" without Stripe metadata.
    const isLegacyPremium =
      userDoc?.subscription?.status === "active" &&
      (userDoc?.subscription?.plan === "individual" || userDoc?.subscription?.plan === "pro")

    if (isLegacyPremium) {
      response.subscribed = true
      response.tier = "pro"
      response.planType = userDoc?.subscription?.planType === "yearly" ? "yearly" : "monthly"
      response.subscriptionStatus = userDoc?.subscription?.subscriptionStatus || "active"
    }

    // Try to find customer by Stripe ID first (if exists on user doc)
    let customer: Stripe.Customer | null = null
    let subscriptions: Stripe.Subscription[] = []
    const subscribedStatuses = new Set(["active", "trialing", "past_due", "unpaid"])

    if (userDoc?.subscription?.stripeCustomerId) {
      try {
        const retrievedCustomer = await stripe.customers.retrieve(userDoc.subscription.stripeCustomerId)
        
        // Check if customer was deleted
        if (!retrievedCustomer.deleted) {
          customer = retrievedCustomer as Stripe.Customer
          
          // Get subscriptions for this customer
          const subList = await stripe.subscriptions.list({
            customer: userDoc.subscription.stripeCustomerId,
            limit: 10,
          })
          subscriptions = subList.data
        }
      } catch (error) {
        console.warn("[Stripe] Error retrieving customer:", error)
      }
    }

    // Fallback: search by email. Some users may have multiple Stripe customers for the same email.
    if (!customer || subscriptions.length === 0) {
      try {
        const customerList = await stripe.customers.list({
          email: userEmail,
          limit: 20,
        })

        if (customerList.data.length > 0) {
          let selectedCustomer: Stripe.Customer | null = null
          let selectedSubscriptions: Stripe.Subscription[] = []

          for (const candidate of customerList.data) {
            const subList = await stripe.subscriptions.list({
              customer: candidate.id,
              status: "all",
              limit: 20,
            })

            const hasSubscribedStatus = subList.data.some((sub) =>
              subscribedStatuses.has(sub.status)
            )

            if (hasSubscribedStatus) {
              selectedCustomer = candidate
              selectedSubscriptions = subList.data
              break
            }

            if (!selectedCustomer) {
              selectedCustomer = candidate
              selectedSubscriptions = subList.data
            }
          }

          if (selectedCustomer) {
            customer = selectedCustomer
            subscriptions = selectedSubscriptions
          }
        }
      } catch (error) {
        console.warn("[Stripe] Error searching customer by email:", error)
      }
    }

    // Check for active subscriptions
    if (subscriptions.length > 0) {
      const activeSubscription = subscriptions.find(
        (sub) => subscribedStatuses.has(sub.status)
      )

      if (activeSubscription && customer) {
        response.subscribed = true
        response.tier = "pro"
        response.stripeCustomerId = customer.id
        response.subscriptionStatus = activeSubscription.status

        // Determine plan type
        const priceId = activeSubscription.items.data[0]?.price?.id
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID) {
          response.planType = "yearly"
        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID) {
          response.planType = "monthly"
        }

        // Get end date
        if ((activeSubscription as any).current_period_end) {
          response.subscriptionEnd = new Date(
            (activeSubscription as any).current_period_end * 1000
          ).toISOString()
        }

        // Update Firestore
        if (customer?.id && adminAvailable) {
          try {
            await updateAdminUserSubscription(userId, {
              stripeCustomerId: customer.id,
              stripeSubscriptionId: activeSubscription.id,
              stripePriceId: priceId,
              plan: "pro",
              planType: response.planType as "monthly" | "yearly",
              status: activeSubscription.status === "active" ? "active" : "past_due",
              subscriptionStatus: activeSubscription.status as any,
              currentPeriodEnd: new Date((activeSubscription as any).current_period_end * 1000),
              subscriptionStartAt: new Date((activeSubscription as any).start_date * 1000),
            })
          } catch (syncError) {
            console.warn("[Stripe] Could not sync subscription to Firestore:", syncError)
          }
        }
      }
    }

    // If no Stripe match, keep Pro access while current period has not ended yet (e.g. cancel at period end).
    const hasFuturePeriodEnd =
      !!userDoc?.subscription?.currentPeriodEnd &&
      new Date(userDoc.subscription.currentPeriodEnd).getTime() > Date.now()

    if (!response.subscribed && userDoc?.subscription?.plan === "pro" && hasFuturePeriodEnd) {
      response.subscribed = true
      response.tier = "pro"
      response.planType = userDoc?.subscription?.planType === "yearly" ? "yearly" : "monthly"
      response.subscriptionStatus = userDoc?.subscription?.subscriptionStatus || "canceled_at_period_end"
      response.subscriptionEnd = new Date(userDoc.subscription.currentPeriodEnd).toISOString()
      response.stripeCustomerId = userDoc?.subscription?.stripeCustomerId
    }

    // If still no active subscription, ensure defaults are set (but never downgrade legacy/pending-end premium users).
    if (
      !response.subscribed &&
      adminAvailable &&
      !isLegacyPremium &&
      userDoc?.subscription?.status !== "inactive"
    ) {
      try {
        await updateAdminUserSubscription(userId, {
          plan: "free",
          planType: "free",
          status: "inactive",
          subscriptionStatus: "none",
        })
      } catch (syncError) {
        console.warn("[Stripe] Could not reset free defaults:", syncError)
      }
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("[Stripe] Check subscription error:", error)
    const message = error instanceof Error ? error.message : "Failed to check subscription"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
