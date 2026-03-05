# Stripe Subscription System Implementation Guide

## Overview

This implementation provides a complete Stripe-based subscription system for Kaizenith. The system follows a Firebase + Next.js API routes architecture (adapted from a Supabase pattern).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                           │
│  (usePremium hook, PricingPage, PremiumGateModal)           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼ (fetch calls)
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes                              │
│  /api/stripe/{create-checkout-session, check-subscription,  │
│               create-billing-portal, webhook}               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│           Stripe API + Firebase Firestore                    │
│  (Create customers, manage subscriptions, handle webhooks)   │
└─────────────────────────────────────────────────────────────┘
```

## Files Created/Modified

### Core Files

- **`lib/firestore-user.ts`** - Updated schema with Stripe subscription fields
- **`hooks/use-premium.ts`** - React hook for subscription management
- **`lib/stripe/config.ts`** - Stripe configuration
- **`lib/stripe/checkout.ts`** - Checkout flow helper

### API Routes

- **`app/api/stripe/create-checkout-session/route.ts`** - Initiate checkout
- **`app/api/stripe/check-subscription/route.ts`** - Verify current status
- **`app/api/stripe/create-billing-portal/route.ts`** - Billing portal access
- **`app/api/stripe/webhook/route.ts`** - Webhook handler

### UI Components

- **`components/premium/premium-gate-modal.tsx`** - Upgrade modal for feature limits
- **`components/premium/pricing-page.tsx`** - Pricing page with plan comparison
- **`components/premium/subscription-status.tsx`** - Display in settings

### Translations

- **`lib/i18n/translations.ts`** - Added English, Spanish, and Japanese strings for premium features

## Setup Instructions

### 1. Stripe Account Setup

1. Go to [https://stripe.com](https://stripe.com) and create an account
2. In the **Stripe Dashboard**:
   - **Create Products:**
     - Product 1: "Pro Monthly" with price $9.99/month
     - Product 2: "Pro Yearly" with price $89.99/year
   
3. **Get Price IDs:**
   - Buy Flow > Products
   - Click on each product → Copy the Price ID (e.g., `price_XXXXXXXXXXXX`)

4. **Get API Keys:**
   - Developers > API Keys
   - Copy both **Publishable Key** and **Secret Key**

5. **Register Webhook:**
   - Developers > Webhooks
   - Click "Add Endpoint"
   - Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.paid`
   - Copy the **Signing Secret**

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Public Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXX

# Stripe Secret Key (Never expose publicly!)
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXX

# Stripe Price IDs (from Step 1)
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_XXXXXXXXXXXX
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_XXXXXXXXXXXX

# Stripe Webhook Secret (for verifying webhook signatures)
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX

# Your app URL for redirects after successful/canceled checkout
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Firestore Schema

The user document schema now includes:

```typescript
subscription: {
  // Tier and plan
  plan: "free" | "pro"
  planType: "free" | "monthly" | "yearly"
  status: "active" | "inactive" | "past_due" | "canceled"
  subscriptionStatus: "none" | "active" | "past_due" | "canceled"
  
  // Stripe IDs
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  
  // Dates
  subscriptionExpiresAt?: Date
  subscriptionStartAt?: Date
  currentPeriodEnd?: Date
}
```

## Usage

### In Components

```typescript
import { usePremium } from "@/hooks/use-premium"

export function MyComponent() {
  const {
    tier,
    planType,
    isPremium,
    loading,
    startCheckout,
    openBillingPortal,
  } = usePremium()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {isPremium ? (
        <button onClick={() => openBillingPortal()}>
          Manage Billing
        </button>
      ) : (
        <button onClick={() => startCheckout("monthly")}>
          Upgrade to Pro
        </button>
      )}
    </div>
  )
}
```

### Feature Gating

```typescript
import { PremiumGateModal } from "@/components/premium/premium-gate-modal"

export function PetsList() {
  const { canAddPet, isPremium } = usePremium()
  const [gateModalOpen, setGateModalOpen] = useState(false)

  const handleAddPet = () => {
    if (!canAddPet(pets.length)) {
      setGateModalOpen(true)
      return
    }
    // Add pet logic
  }

  return (
    <>
      <button onClick={handleAddPet}>Add Pet</button>
      <PremiumGateModal
        open={gateModalOpen}
        onOpenChange={setGateModalOpen}
        limitType="pets"
      />
    </>
  )
}
```

### Pricing Page

```typescript
import { PricingPage } from "@/components/premium/pricing-page"

export default function PricingRoute() {
  return <PricingPage />
}
```

### Billing Settings

```typescript
import { SubscriptionStatus } from "@/components/premium/subscription-status"

export function SettingsBilling() {
  return (
    <div>
      <h1>Billing & Subscription</h1>
      <SubscriptionStatus />
    </div>
  )
}
```

## Testing

### Test Mode

1. Keep `STRIPE_SECRET_KEY` as test key (`sk_test_...`)
2. Test checkout with card: **4242 4242 4242 4242**
   - Expiry: Any future date
   - CVC: Any 3 digits

### Test Scenarios

1. **Successful Subscription:**
   - Click "Upgrade to Pro"
   - Use test card 4242...
   - Complete checkout
   - Check Firestore → subscription status should be "active"

2. **Check Subscription Status:**
   - Call `/api/stripe/check-subscription` via `usePremium()` hook
   - Should return `{ subscribed: true, tier: "pro", ... }`

3. **Billing Portal:**
   - Click "Manage Billing" in settings
   - Should open Stripe portal for subscription management

4. **Cancel Subscription:**
   - In Stripe Dashboard or via portal
   - Webhook should update Firestore → plan back to "free"

5. **Verify Webhook:**
   - Use Stripe CLI locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - Check logs for webhook events

## Feature Limits

### Free Plan
- 1 Pet
- 10 Records per Category
- Basic Features

### Pro Plan
- Unlimited Pets
- Unlimited Records
- All Features
- Priority Support
- Advanced Analytics

Edit limits in `hooks/use-premium.ts` in the `FEATURE_LIMITS` object.

## Security Considerations

1. **API Keys:**
   - Never expose `STRIPE_SECRET_KEY` in frontend code
   - Keep in `.env.local` only
   - For production, use environment variables in your hosting provider

2. **Webhook Verification:**
   - All webhooks are verified using `stripe.webhooks.constructEvent()`
   - Invalid signatures are rejected

3. **User Isolation:**
   - All subscription updates tied to specific user ID
   - Users can only access their own subscription

4. **RLS (Row Level Security):**
   - Firestore rules ensure users can only read/write their own data
   - Enforce at security rules level, not just code

## Troubleshooting

### Error: "Could not load the default credentials"

This is handled gracefully in development. For production:
1. Ensure `STRIPE_SECRET_KEY` is set in environment variables
2. Verify Firebase Admin SDK is properly initialized

### Webhook Not Triggering

1. Check webhook endpoint URL is publicly accessible
2. Verify webhook signing secret in `.env`
3. Test with Stripe CLI: `stripe trigger customer.subscription.created`

### Checkout Redirect Not Working

1. Verify `NEXT_PUBLIC_APP_URL` is correct
2. Check Stripe Secret Key is correct
3. Ensure price IDs are correct and valid

### Subscription Not Detected

1. Manual check: Call `/api/stripe/check-subscription` endpoint
2. Verify Stripe Customer ID was saved to Firestore
3. Check Stripe Dashboard for active subscriptions under customer

## Next Steps

1. **Configure Email Notifications:**
   - Stripe automatically sends payment/renewal emails
   - Configure templates in Stripe Dashboard > Email Settings

2. **Add Analytics:**
   - Track subscription events in analytics tool
   - Monitor churn and upgrade rates

3. **Handle Plan Changes:**
   - Implement plan upgrade/downgrade logic
   - Handle pro-rata billing

4. **Add Custom Features:**
   - Implement advanced analytics for pro users
   - Add priority support channels
   - Create exclusive content/features

## Support

For Stripe integration issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Webhook Events](https://stripe.com/docs/webhooks)

For Firebase issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
