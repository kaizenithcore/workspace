// Stripe Configuration
// Get these from: Stripe Dashboard > Developers > API keys

import { loadStripe, type Stripe } from "@stripe/stripe-js"

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Price IDs for subscription plans
// Get these from: Stripe Dashboard > Products > Prices
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || "price_monthly",
  PRO_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || "price_yearly",
}

// Webhook Secret (used for verifying webhook signatures)
// Get this from: Stripe Dashboard > Webhook endpoints > select your endpoint > Signing secret
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ""

