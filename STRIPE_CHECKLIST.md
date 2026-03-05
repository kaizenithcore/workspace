# Stripe Integration Implementation Checklist

## ✅ Completed Components

### Database & Types
- [x] Updated `UserSubscription` interface with Stripe fields
- [x] Added Firestore helper functions:
  - `updateUserSubscription()`
  - `getUserByStripeCustomerId()`
  - `ensureSubscriptionDefaults()`

### API Endpoints
- [x] `/api/stripe/create-checkout-session` - Initiate payment
- [x] `/api/stripe/check-subscription` - Verify subscription status
- [x] `/api/stripe/create-billing-portal` - Manage subscription
- [x] `/api/stripe/webhook` - Handle 5 Stripe events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.paid`

### React Hook
- [x] `hooks/use-premium.ts` with:
  - Subscription state management
  - Auto-refresh every 60 seconds
  - Feature limit checks (pets, records)
  - Checkout flow
  - Billing portal access

### UI Components
- [x] `PremiumGateModal` - Shows when user hits a limit
- [x] `PricingPage` - Monthly/yearly plan selector
- [x] `SubscriptionStatus` - Display in settings

### Translations
- [x] English (en) - 41 new keys
- [x] Spanish (es) - 41 new keys
- [x] Japanese (ja) - 41 new keys

### Configuration
- [x] Updated `lib/stripe/config.ts`
- [x] Updated `lib/stripe/checkout.ts`
- [x] Created `STRIPE_SETUP_GUIDE.md`

---

## 🔧 Configuration Checklist

### 1. Stripe Account Setup
- [ ] Create Stripe account at https://stripe.com
- [ ] Create "Pro Monthly" product ($9.99/month)
- [ ] Create "Pro Yearly" product ($89.99/year)
- [ ] Copy Price IDs:
  - [ ] `NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID` = `price_...`
  - [ ] `NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID` = `price_...`
- [ ] Get API Keys:
  - [ ] `STRIPE_SECRET_KEY` = `sk_test_...`
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...`
- [ ] Register webhook endpoint:
  - [ ] URL: `https://yourdomain.com/api/stripe/webhook`
  - [ ] Events: checkout.session.completed, customer.subscription.*, invoice.*
  - [ ] Copy `STRIPE_WEBHOOK_SECRET` = `whsec_...`

### 2. Environment Variables Setup
- [ ] Add to `.env.local`:
  ```
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_SECRET_KEY=sk_test_...
  NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
  NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```
- [ ] Verify in `.env.local` (never commit secrets!)
- [ ] For production, set in hosting provider's environment variables

### 3. Firebase Setup
- [ ] Firestore indexes created (if needed)
- [ ] Security rules updated for subscription fields
- [ ] Firebase Admin SDK configured with credentials

### 4. Testing Setup
- [ ] Stripe CLI installed: `npm install -g @stripe/cli`
- [ ] Logged in: `stripe login`
- [ ] Webhook forwarding: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

---

## 🧪 Test Scenarios

### Test Card Numbers
- Successful payment: `4242 4242 4242 4242`
- Requires authentication: `4000 0025 0000 3155`
- Declined card: `4000 0000 0000 0002`
- Any expiry (future date), any 3-digit CVC

### Test Workflows

#### 1. Successful Subscription Flow
- [ ] Navigate to pricing page or click "Upgrade"
- [ ] Select monthly or yearly plan
- [ ] Complete checkout with test card `4242...`
- [ ] Verify redirect to success page
- [ ] Check Firestore: user.subscription.status = "active"
- [ ] Check Stripe Dashboard: new customer and subscription created
- [ ] `usePremium()` hook now returns `isPremium: true`

#### 2. Check Subscription Status
- [ ] Call `usePremium()` hook on component mount
- [ ] Verify network request to `/api/stripe/check-subscription`
- [ ] Confirm response shows correct tier and plan type
- [ ] Auto-refresh every 60 seconds working

#### 3. Billing Portal Access
- [ ] Click "Manage Billing" button in settings
- [ ] Redirected to Stripe billing portal
- [ ] Can update payment method, view invoices, cancel subscription

#### 4. Cancel Subscription
- [ ] In Stripe Dashboard, cancel subscription manually
- [ ] Webhook triggers `customer.subscription.deleted` event
- [ ] Check logs: webhook processed successfully
- [ ] Firestore updated: subscription.plan = "free"
- [ ] `usePremium()` now returns `isPremium: false`

#### 5. Payment Failure Handling
- [ ] Use card `4000 0000 0000 0002` (always declines)
- [ ] Verify webhook receives `invoice.payment_failed`
- [ ] Firestore updated: subscription.status = "past_due"
- [ ] User sees warning message

#### 6. Payment Recovered
- [ ] Use Stripe Dashboard to retry failed invoice
- [ ] Webhook triggers `invoice.paid`
- [ ] Firestore updated: subscription.status = "active"

---

## 🚀 Integration Points

### Usage in Your App

#### Usage 1: Feature Gate Modal
```typescript
import { usePremium } from "@/hooks/use-premium"
import { PremiumGateModal } from "@/components/premium/premium-gate-modal"

export function AddPetButton() {
  const { canAddPet, isPremium } = usePremium()
  const [gateOpen, setGateOpen] = useState(false)

  const handleClick = () => {
    if (!canAddPet(petCount)) {
      setGateOpen(true)
      return
    }
    // Add pet logic
  }

  return (
    <>
      <button onClick={handleClick}>Add Pet</button>
      <PremiumGateModal open={gateOpen} onOpenChange={setGateOpen} limitType="pets" />
    </>
  )
}
```

#### Usage 2: Pricing Page
```typescript
import { PricingPage } from "@/components/premium/pricing-page"

export default function Pricing() {
  return <PricingPage />
}
```

#### Usage 3: Settings / Billing
```typescript
import { SubscriptionStatus } from "@/components/premium/subscription-status"

export function Settings() {
  return (
    <div>
      <SubscriptionStatus />
    </div>
  )
}
```

---

## 📝 Feature Limits

Currently configured:
- **Free:** 1 pet, 10 records/category
- **Pro:** Unlimited

To customize, edit `hooks/use-premium.ts`:
```typescript
const FEATURE_LIMITS = {
  free: {
    maxPets: 1,
    maxRecordsPerCategory: 10,
    maxProjectsPerGroup: 3,
  },
  pro: {
    maxPets: Infinity,
    maxRecordsPerCategory: Infinity,
    maxProjectsPerGroup: Infinity,
  },
}
```

---

## 🔒 Security Review

- [x] Secret keys only in `.env.local`
- [x] Webhook signatures verified
- [x] User IDs validated in API routes
- [x] Firestore rules enforce user isolation
- [x] No hardcoded credentials
- [x] Error messages don't expose sensitive info
- [x] Admin SDK only used server-side

---

## 📊 Monitoring & Debugging

### Log errors in these places:
1. Browser console (client-side errors)
2. Server logs (API route errors)
3. Firestore (subscription data)
4. Stripe Dashboard (customer activity)

### Use these to debug:
- Chrome DevTools Network tab to see API calls
- Stripe CLI logs for webhook events
- Firestore Admin SDK to inspect user documents
- Stripe Dashboard webhook delivery logs

---

## 🎉 Success Criteria

System is ready when:
- [ ] User can complete checkout successfully
- [ ] Webhook updates Firestore correctly
- [ ] `usePremium()` detects premium status
- [ ] Feature gates block free users
- [ ] Pricing page displays correctly
- [ ] Billing portal works
- [ ] Cancellations handled properly
- [ ] All 5 webhook events processed
- [ ] Error messages are user-friendly
- [ ] Dashboard shows correct subscription tiers

---

## 🚨 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Could not load default credentials" | Firebase Admin SDK not configured | Set `STRIPE_SECRET_KEY` in env |
| Webhook not triggering | Endpoint not registered | Register in Stripe Dashboard |
| `isPremium` always false | Subscription not found | Check Stripe Customer ID in Firestore |
| Checkout redirect fails | Missing price IDs | Verify all Stripe price IDs in env |
| Test card declined | Not in test mode | Ensure using `sk_test_` keys |
| Payment info not saving | API error ignored | Check server logs for validation errors |

---

## 📚 Documentation

- **Setup:** See `STRIPE_SETUP_GUIDE.md`
- **Hook API:** See `hooks/use-premium.ts` JSDoc
- **Components:** See component files for prop types
- **Stripe Docs:** https://stripe.com/docs

---

## ✨ Next Features to Add

- [ ] Plan upgrade/downgrade
- [ ] Prorated billing
- [ ] Coupon/discount codes
- [ ] Usage-based billing
- [ ] Custom branding in emails
- [ ] Dunning management (retry failed payments)
- [ ] Analytics dashboard for subscriptions
