// Stripe Checkout Session API Route
// Creates a Stripe Checkout session for subscription

import { NextResponse } from "next/server"
// import Stripe from "stripe"

// TODO: Uncomment when Stripe is configured
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: "2023-10-16",
// })

export async function POST(request: Request) {
  try {
    const { priceId, userId, userEmail } = await request.json()

    // TODO: Uncomment when Stripe is configured
    // const session = await stripe.checkout.sessions.create({
    //   mode: "subscription",
    //   payment_method_types: ["card"],
    //   line_items: [
    //     {
    //       price: priceId,
    //       quantity: 1,
    //     },
    //   ],
    //   customer_email: userEmail,
    //   metadata: {
    //     userId,
    //   },
    //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    //   subscription_data: {
    //     trial_period_days: 7,
    //     metadata: {
    //       userId,
    //     },
    //   },
    // })

    // return NextResponse.json({ sessionId: session.id })

    // Stub response for development
    console.log("[Stripe Stub] Creating checkout session:", { priceId, userId, userEmail })
    return NextResponse.json({
      sessionId: "stub_session_id",
      message: "Stripe not configured. This is a stub response.",
    })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
