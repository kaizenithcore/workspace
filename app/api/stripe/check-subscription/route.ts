// Check Subscription Status API Route
// Verifies current subscription status and updates Firestore

import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getAdminUserDocument, updateAdminUserSubscription } from "@/lib/firebase-admin"
import { isFirebaseCredentialError, logFirebaseCredentialError } from "@/lib/firebase-admin-errors"

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
      
      // Check if it's a credential configuration error
      if (isFirebaseCredentialError(adminError)) {
        logFirebaseCredentialError(adminError, "Stripe check-subscription")
      } else {
        console.warn("[Stripe] Admin fetch error in check-subscription route:", adminError)
      }
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

    // When admin is unavailable, we can still check Stripe directly by email
    // This allows showing the correct subscription status in UI even without Firebase sync
    if (!adminAvailable) {
      console.info("[Stripe] Admin unavailable - checking Stripe directly by email (read-only mode)")
    }

    // Legacy fallback: existing paid users may have plan="individual" without Stripe metadata.
    const isLegacyPremium =
      adminAvailable &&
      userDoc?.subscription?.status === "active" &&
      (userDoc?.subscription?.plan === "individual" || userDoc?.subscription?.plan === "pro")

    if (isLegacyPremium) {
      response.subscribed = true
      response.tier = "pro"
      response.planType = userDoc?.subscription?.planType === "yearly" ? "yearly" : "monthly"
      response.subscriptionStatus = userDoc?.subscription?.subscriptionStatus || "active"
    }

    // Try to find customer by Stripe ID first (if exists on user doc)
    // Only available when Firebase Admin is configured
    let customer: Stripe.Customer | null = null
    let subscriptions: Stripe.Subscription[] = []
    const subscribedStatuses = new Set(["active", "trialing", "past_due", "unpaid"])

    if (adminAvailable && userDoc?.subscription?.stripeCustomerId) {
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
    // This is critical for reconciling Firebase data when stripeCustomerId is missing
    // This works even without Firebase Admin - allows showing correct status in UI
    if (!customer || subscriptions.length === 0) {
      console.log(`[Stripe] Searching for customer by email ${adminAvailable ? 'fallback' : '(admin unavailable - Stripe direct check)'}: ${userEmail}`)
      try {
        const customerList = await stripe.customers.list({
          email: userEmail,
          limit: 20,
        })

        if (customerList.data.length > 0) {
          console.log(`[Stripe] Found ${customerList.data.length} customer(s) for email ${userEmail}`)
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
              console.log(`[Stripe] Selected customer ${candidate.id} with active subscription`)
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

        // ALWAYS update Firestore with Stripe data (source of truth priority)
        // This reconciles any discrepancies between Firebase and Stripe
        if (customer?.id && adminAvailable) {
          try {
            // Check if there's a discrepancy between Firebase and Stripe
            const hadDiscrepancy = 
              userDoc?.subscription?.plan !== "pro" ||
              userDoc?.subscription?.status !== "active" ||
              userDoc?.subscription?.stripeCustomerId !== customer.id

            if (hadDiscrepancy) {
              console.log(`[Stripe] Reconciling data discrepancy for user ${userId}: Firebase had plan=${userDoc?.subscription?.plan}, status=${userDoc?.subscription?.status}, but Stripe shows active ${response.planType} subscription`)
            }

            // Safely convert Stripe timestamps to Date objects (only if valid)
            const currentPeriodEnd = (activeSubscription as any).current_period_end
            const startDate = (activeSubscription as any).start_date

            const updateData: any = {
              stripeCustomerId: customer.id,
              stripeSubscriptionId: activeSubscription.id,
              stripePriceId: priceId,
              plan: "pro",
              planType: response.planType as "monthly" | "yearly",
              status: activeSubscription.status === "active" ? "active" : "past_due",
              subscriptionStatus: activeSubscription.status as any,
            }

            // Only add date fields if they're valid numbers
            if (typeof currentPeriodEnd === 'number' && currentPeriodEnd > 0) {
              updateData.currentPeriodEnd = new Date(currentPeriodEnd * 1000)
            }
            if (typeof startDate === 'number' && startDate > 0) {
              updateData.subscriptionStartAt = new Date(startDate * 1000)
            }

            await updateAdminUserSubscription(userId, updateData)

            if (hadDiscrepancy) {
              console.log(`[Stripe] ✓ Successfully reconciled Firebase data for user ${userId}`)
            }
          } catch (syncError) {
            console.error("[Stripe] Could not sync subscription to Firestore:", syncError)
          }
        } else if (customer?.id && !adminAvailable) {
          console.warn(`[Stripe] Found active ${response.planType} subscription for ${userEmail} but cannot sync to Firebase (admin credentials not configured)`)
          console.warn("[Stripe] The user will see correct PRO status in UI, but Firebase will not be updated")
          console.warn("[Stripe] To enable Firebase sync, configure FIREBASE_SERVICE_ACCOUNT in .env.local")
        }
      }
    }

    // If no Stripe match, keep Pro access while current period has not ended yet (e.g. cancel at period end).
    // Only check this when Firebase Admin is available
    const hasFuturePeriodEnd =
      adminAvailable &&
      !!userDoc?.subscription?.currentPeriodEnd &&
      new Date(userDoc.subscription.currentPeriodEnd).getTime() > Date.now()

    if (!response.subscribed && adminAvailable && userDoc?.subscription?.plan === "pro" && hasFuturePeriodEnd) {
      response.subscribed = true
      response.tier = "pro"
      response.planType = userDoc?.subscription?.planType === "yearly" ? "yearly" : "monthly"
      response.subscriptionStatus = userDoc?.subscription?.subscriptionStatus || "canceled_at_period_end"
      response.subscriptionEnd = new Date(userDoc.subscription.currentPeriodEnd).toISOString()
      response.stripeCustomerId = userDoc?.subscription?.stripeCustomerId
    }

    // If still no active subscription, ensure defaults are set (but never downgrade legacy/pending-end premium users).
    // Only update Firebase when Admin is available
    if (
      !response.subscribed &&
      adminAvailable &&
      userDoc &&
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

    // If admin is not available and no subscription found, inform the user
    if (!response.subscribed && !adminAvailable) {
      console.info("[Stripe] No active subscription found in Stripe for ${userEmail}")
      console.info("[Stripe] Cannot verify against Firebase (admin credentials not configured)")
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("[Stripe] Check subscription error:", error)
    const message = error instanceof Error ? error.message : "Failed to check subscription"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
