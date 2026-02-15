"use client"

// Stripe Checkout Flow (Client-side)
// This creates a checkout session and redirects to Stripe

import { getStripe, STRIPE_PRICES } from "./config"

interface CheckoutOptions {
  priceId: string
  userId: string
  userEmail: string
}

export async function redirectToCheckout({ priceId, userId, userEmail }: CheckoutOptions) {
  try {
    // Create checkout session via API route
    const response = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
      }),
    })

    const { sessionId, error } = await response.json()

    if (error) {
      throw new Error(error)
    }

    // Redirect to Stripe Checkout
    const stripe = await getStripe()
    if (!stripe) {
      throw new Error("Stripe failed to load")
    }

    const { error: redirectError } = await stripe.redirectToCheckout({
      sessionId,
    })

    if (redirectError) {
      throw new Error(redirectError.message)
    }
  } catch (err) {
    console.error("Checkout error:", err)
    throw err
  }
}

export async function startProTrial(userId: string, userEmail: string) {
  return redirectToCheckout({
    priceId: STRIPE_PRICES.PRO_MONTHLY,
    userId,
    userEmail,
  })
}
