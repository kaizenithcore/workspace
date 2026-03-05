// Create Billing Portal Session API Route
// Generates a Stripe billing portal session for subscription management

import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getAdminUserDocument } from "@/lib/firebase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, flow } = await request.json()

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Missing userId or userEmail" },
        { status: 400 }
      )
    }

    let customerId: string | undefined
    let subscriptionId: string | undefined

    const cancellableStatuses = new Set([
      "active",
      "trialing",
      "past_due",
      "unpaid",
      "incomplete",
    ])

    const findCancellableForCustomer = async (candidateCustomerId: string) => {
      const subscriptions = await stripe.subscriptions.list({
        customer: candidateCustomerId,
        status: "all",
        limit: 20,
      })

      return subscriptions.data.find((subscription) =>
        cancellableStatuses.has(subscription.status)
      )
    }

    // Try Firestore first, but continue if Admin credentials are not configured locally.
    try {
      const userDoc = await getAdminUserDocument(userId)
      if (userDoc) {
        customerId = userDoc.subscription?.stripeCustomerId
        subscriptionId = userDoc.subscription?.stripeSubscriptionId
      }
    } catch (adminError) {
      console.warn("[Stripe] Admin unavailable in billing-portal route:", adminError)
    }

    // Best source of truth when available: retrieve known subscription and derive customer
    if (subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        customerId = subscription.customer as string
      } catch (error) {
        console.warn("[Stripe] Error retrieving subscription by ID:", error)
      }
    }

    // If no customer ID on file, try to find by email
    if (!customerId) {
      try {
        const customerList = await stripe.customers.list({
          email: userEmail,
          limit: 20,
        })

        if (customerList.data.length > 0) {
          // Prefer a customer that has a cancellable subscription.
          for (const candidate of customerList.data) {
            const cancellable = await findCancellableForCustomer(candidate.id)
            if (cancellable) {
              customerId = candidate.id
              subscriptionId = cancellable.id
              break
            }
          }

          // Fallback to the first customer to at least open billing portal.
          if (!customerId) {
            customerId = customerList.data[0].id
          }
        }
      } catch (error) {
        console.warn("[Stripe] Error finding customer:", error)
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "No Stripe customer found for this user" },
        { status: 404 }
      )
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings`

    if (flow === "cancel") {
      const cancellableSubscription = subscriptionId
        ? await stripe.subscriptions.retrieve(subscriptionId)
        : await findCancellableForCustomer(customerId)

      if (!cancellableSubscription || !cancellableStatuses.has(cancellableSubscription.status)) {
        // Fallback gracefully: open standard portal instead of surfacing a hard error.
        const fallbackSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: returnUrl,
        })

        if (!fallbackSession.url) {
          throw new Error("Failed to generate billing portal URL")
        }

        return NextResponse.json({ url: fallbackSession.url }, { status: 200 })
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
        flow_data: {
          type: "subscription_cancel",
          subscription_cancel: {
            subscription: cancellableSubscription.id,
          },
        },
      })

      if (!session.url) {
        throw new Error("Failed to generate billing portal URL")
      }

      return NextResponse.json({ url: session.url }, { status: 200 })
    }

    // Create standard billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    if (!session.url) {
      throw new Error("Failed to generate billing portal URL")
    }

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (error) {
    console.error("[Stripe] Billing portal error:", error)
    const message = error instanceof Error ? error.message : "Failed to create billing portal session"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
