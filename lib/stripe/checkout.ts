// Stripe Checkout Flow (Client-side)
// This creates a checkout session and redirects to Stripe

import { STRIPE_PRICES } from "./config"

interface CheckoutOptions {
  priceId: string
  userId: string
  userEmail: string
}

/**
 * Redirect to Stripe checkout by calling our API endpoint
 */
export async function redirectToCheckout({ priceId, userId, userEmail }: CheckoutOptions) {
  try {
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

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to create checkout session")
    }

    // Redirect to checkout URL
    if (data.url) {
      window.location.href = data.url
    } else {
      throw new Error("No checkout URL returned")
    }
  } catch (err) {
    console.error("[Stripe] Checkout error:", err)
    throw err
  }
}

/**
 * Start Pro trial (monthly)
 */
export async function startProTrial(userId: string, userEmail: string) {
  return redirectToCheckout({
    priceId: STRIPE_PRICES.PRO_MONTHLY,
    userId,
    userEmail,
  })
}

/**
 * Start Pro monthly subscription
 */
export async function startProMonthly(userId: string, userEmail: string) {
  return redirectToCheckout({
    priceId: STRIPE_PRICES.PRO_MONTHLY,
    userId,
    userEmail,
  })
}

/**
 * Start Pro yearly subscription
 */
export async function startProYearly(userId: string, userEmail: string) {
  return redirectToCheckout({
    priceId: STRIPE_PRICES.PRO_YEARLY,
    userId,
    userEmail,
  })
}
