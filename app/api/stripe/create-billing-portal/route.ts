// Create Billing Portal Session API Route
// Generates a Stripe billing portal session for subscription management

import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getAdminUserDocument } from "@/lib/firebase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail } = await request.json()

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Missing userId or userEmail" },
        { status: 400 }
      )
    }

    let customerId: string | undefined

    // Try Firestore first, but continue if Admin credentials are not configured locally.
    try {
      const userDoc = await getAdminUserDocument(userId)
      if (userDoc) {
        customerId = userDoc.subscription?.stripeCustomerId
      }
    } catch (adminError) {
      console.warn("[Stripe] Admin unavailable in billing-portal route:", adminError)
    }

    // If no customer ID on file, try to find by email
    if (!customerId) {
      try {
        const customerList = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        })

        if (customerList.data.length > 0) {
          customerId = customerList.data[0].id
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

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
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
