// Stripe Webhook Handler
// Processes Stripe events: checkout.session.completed, subscription events, payment status

import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { 
  getAdminUserByStripeCustomerId,
  updateAdminUserSubscription,
} from "@/lib/firebase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

/**
 * Verify Stripe webhook signature
 * Returns parsed event if valid, throws if invalid
 */
async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    throw new Error(`Webhook signature verification failed: ${message}`)
  }
}

/**
 * Handle checkout.session.completed
 * User has completed payment, subscription is now active
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  
  if (!userId) {
    console.warn("[Webhook] No userId in checkout session metadata - cannot update user document")
    console.warn("[Webhook] Session ID:", session.id, "Customer:", session.customer)
    return
  }

  console.log(`[Webhook] Checkout completed for user ${userId}`)

  // Get subscription details
  if (!session.subscription) {
    console.warn("[Webhook] No subscription found in checkout session")
    return
  }

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  // Determine plan type
  const priceId = subscription.items.data[0]?.price?.id
  let planType: "monthly" | "yearly" = "monthly"
  
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID) {
    planType = "yearly"
  }

  console.log(`[Webhook] Updating user ${userId} to ${planType} Pro plan`)

  // Update user subscription
  try {
    // Safely convert Stripe timestamps to Date objects (only if valid)
    const currentPeriodEnd = (subscription as any).current_period_end
    const startDate = (subscription as any).start_date

    const updateData: any = {
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      plan: "pro",
      planType,
      status: "active",
      subscriptionStatus: subscription.status as any,
    }

    // Only add date fields if they're valid numbers
    if (typeof currentPeriodEnd === 'number' && currentPeriodEnd > 0) {
      updateData.currentPeriodEnd = new Date(currentPeriodEnd * 1000)
    }
    if (typeof startDate === 'number' && startDate > 0) {
      updateData.subscriptionStartAt = new Date(startDate * 1000)
    }

    await updateAdminUserSubscription(userId, updateData)
    console.log(`[Webhook] ✓ Successfully updated user ${userId} subscription`)
  } catch (error) {
    console.error(`[Webhook] Failed to update user ${userId}:`, error)
    throw error
  }
}

/**
 * Handle customer.subscription.updated
 * Subscription details changed, plan upgrade/downgrade, etc.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  console.log(`[Webhook] Subscription updated: ${subscription.id}, status: ${subscription.status}`)

  // Find user by Stripe customer ID
  const result = await getAdminUserByStripeCustomerId(customerId)
  if (!result) {
    console.warn(`[Webhook] No user found for customer ${customerId} - cannot sync subscription update`)
    return
  }

  const { uid } = result
  console.log(`[Webhook] Found user ${uid} for customer ${customerId}`)

  // Determine plan type
  const priceId = subscription.items.data[0]?.price?.id
  let planType: "monthly" | "yearly" = "monthly"
  
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID) {
    planType = "yearly"
  }

  // Update subscription info
  try {
    // Safely convert Stripe timestamps to Date objects (only if valid)
    const currentPeriodEnd = (subscription as any).current_period_end

    const updateData: any = {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      planType,
      subscriptionStatus: subscription.status as any,
      // If subscription is scheduled to cancel, keep status but mark for update
      status: subscription.status === "active" ? "active" : "past_due",
      ...(subscription.status === "active" ? { plan: "pro" } : {}),
    }

    // Only add date field if it's a valid number
    if (typeof currentPeriodEnd === 'number' && currentPeriodEnd > 0) {
      updateData.currentPeriodEnd = new Date(currentPeriodEnd * 1000)
    }

    await updateAdminUserSubscription(uid, updateData)
    console.log(`[Webhook] ✓ Successfully updated user ${uid} subscription status to ${subscription.status}`)
  } catch (error) {
    console.error(`[Webhook] Failed to update user ${uid}:`, error)
    throw error
  }
}

/**
 * Handle customer.subscription.deleted
 * User cancelled subscription, revert to free plan
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  console.log(`[Webhook] Subscription deleted: ${subscription.id}`)

  // Find user by Stripe customer ID
  const result = await getAdminUserByStripeCustomerId(customerId)
  if (!result) {
    console.warn(`[Webhook] No user found for customer ${customerId} - cannot sync subscription deletion`)
    return
  }

  const { uid } = result
  console.log(`[Webhook] Reverting user ${uid} to free plan after subscription deletion`)

  // Revert to free plan
  try {
    await updateAdminUserSubscription(uid, {
      plan: "free",
      planType: "free",
      status: "inactive",
      subscriptionStatus: "canceled",
      stripeSubscriptionId: undefined,
      stripePriceId: undefined,
    })
    console.log(`[Webhook] ✓ Successfully reverted user ${uid} to free plan`)
  } catch (error) {
    console.error(`[Webhook] Failed to revert user ${uid} to free:`, error)
    throw error
  }
}

/**
 * Handle invoice.payment_failed
 * Payment failed, mark subscription as past_due
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  
  if (!customerId) {
    console.warn("[Webhook] No customer ID in invoice - cannot process payment failure")
    return
  }

  console.log(`[Webhook] Payment failed for customer ${customerId}, invoice: ${invoice.id}`)

  // Find user
  const result = await getAdminUserByStripeCustomerId(customerId)
  if (!result) {
    console.warn(`[Webhook] No user found for customer ${customerId} - cannot sync payment failure`)
    return
  }

  const { uid } = result
  console.log(`[Webhook] Marking user ${uid} subscription as past_due after payment failure`)

  // Mark as past_due
  try {
    await updateAdminUserSubscription(uid, {
      status: "past_due",
      subscriptionStatus: "past_due",
    })
    console.log(`[Webhook] ✓ Successfully marked user ${uid} as past_due`)
  } catch (error) {
    console.error(`[Webhook] Failed to update user ${uid}:`, error)
    throw error
  }
}

/**
 * Handle invoice.paid
 * Payment succeeded, reactivate if was past_due
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  
  if (!customerId) {
    console.warn("[Webhook] No customer ID in invoice - cannot process payment success")
    return
  }

  console.log(`[Webhook] Invoice paid for customer ${customerId}, invoice: ${invoice.id}`)

  // Find user
  const result = await getAdminUserByStripeCustomerId(customerId)
  if (!result) {
    console.warn(`[Webhook] No user found for customer ${customerId} - cannot sync payment success`)
    return
  }

  const { uid } = result
  console.log(`[Webhook] Reactivating user ${uid} subscription after successful payment`)

  // Mark as active
  try {
    await updateAdminUserSubscription(uid, {
      status: "active",
      subscriptionStatus: "active",
    })
    console.log(`[Webhook] ✓ Successfully reactivated user ${uid} subscription`)
  } catch (error) {
    console.error(`[Webhook] Failed to reactivate user ${uid}:`, error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      console.error("[Webhook] No signature provided")
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 401 }
      )
    }

    // Verify webhook signature
    const event = await verifyWebhookSignature(body, signature)
    
    console.log(`[Webhook] Received event: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    
    // Return 400 to tell Stripe to retry
    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
