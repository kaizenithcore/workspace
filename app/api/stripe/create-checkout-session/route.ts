// Stripe Checkout Session API Route
// Creates a Stripe Checkout session for subscription

import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getAdminUserDocument, updateAdminUserSubscription } from "@/lib/firebase-admin"
import { isFirebaseCredentialError, logFirebaseCredentialError } from "@/lib/firebase-admin-errors"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId, userEmail } = await request.json()

    if (!priceId || !userId || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: priceId, userId, userEmail" },
        { status: 400 }
      )
    }

    let userDoc: any = null
    try {
      userDoc = await getAdminUserDocument(userId)
    } catch (adminError) {
      // Local dev may not have Admin credentials; continue with Stripe-only flow.
      if (isFirebaseCredentialError(adminError)) {
        logFirebaseCredentialError(adminError, "Stripe create-checkout-session")
      } else {
        console.warn("[Stripe] Admin unavailable in checkout route:", adminError)
      }
    }

    // If user is already premium (including legacy individual plan), do not create checkout.
    const hasActivePremium =
      userDoc?.subscription?.status === "active" &&
      (userDoc?.subscription?.plan === "pro" || userDoc?.subscription?.plan === "individual")

    if (hasActivePremium) {
      return NextResponse.json(
        {
          error: "User already has an active subscription. Use billing portal to manage.",
        },
        { status: 400 }
      )
    }

    // Validate Stripe API key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[Stripe] STRIPE_SECRET_KEY is not configured")
      return NextResponse.json(
        { error: "Stripe is not properly configured. Please contact support." },
        { status: 500 }
      )
    }

    // Get or create Stripe customer
    let customerId: string

    try {
      // Try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            userId,
          },
        })
        customerId = customer.id

      }
    } catch (stripeError) {
      console.error("[Stripe] Error managing customer:", stripeError)
      const errorMessage = stripeError instanceof Error ? stripeError.message : "Failed to manage Stripe customer"
      return NextResponse.json(
        { error: `Stripe error: ${errorMessage}` },
        { status: 500 }
      )
    }

    // Best-effort sync of Stripe customer ID to Firestore; do not fail checkout on local credential issues.
    try {
      await updateAdminUserSubscription(userId, {
        stripeCustomerId: customerId,
      })
    } catch (syncError) {
      console.warn("[Stripe] Could not sync stripeCustomerId to Firestore:", syncError)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
      // Enable promotion codes in checkout
      allow_promotion_codes: true,
      // Add subscription metadata
      subscription_data: {
        metadata: {
          userId,
        },
      },
    })

    if (!session.url) {
      throw new Error("Failed to generate checkout URL")
    }

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (error) {
    console.error("[Stripe] Checkout error:", error)
    const message = error instanceof Error ? error.message : "Failed to create checkout session"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
