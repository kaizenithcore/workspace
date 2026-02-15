// Example Cloud Function for Stripe Webhooks
// Deploy this to Firebase Cloud Functions or similar

// This webhook handler processes Stripe events and updates user subscriptions in Firestore

/*
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

admin.initializeApp();
const db = admin.firestore();

// Webhook endpoint secret from Stripe Dashboard
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata.userId;
      
      // Update user's subscription status
      await db.doc(`users/${userId}`).update({
        "subscription.plan": "trial",
        "subscription.trialEndsAt": admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        ),
        "subscription.stripeCustomerId": session.customer,
        "subscription.stripeSubscriptionId": session.subscription,
      });
      
      console.log(`Trial started for user: ${userId}`);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;
      
      const plan = subscription.status === "active" ? "pro" : 
                   subscription.status === "trialing" ? "trial" : "free";
      
      await db.doc(`users/${userId}`).update({
        "subscription.plan": plan,
        "subscription.currentPeriodEnd": admin.firestore.Timestamp.fromMillis(
          subscription.current_period_end * 1000
        ),
        "subscription.cancelAtPeriodEnd": subscription.cancel_at_period_end,
      });
      
      console.log(`Subscription updated for user: ${userId}, plan: ${plan}`);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;
      
      await db.doc(`users/${userId}`).update({
        "subscription.plan": "free",
        "subscription.currentPeriodEnd": null,
        "subscription.cancelAtPeriodEnd": false,
      });
      
      console.log(`Subscription cancelled for user: ${userId}`);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const userId = invoice.subscription_details?.metadata?.userId;
      
      if (userId) {
        // Optionally notify user of payment failure
        console.log(`Payment failed for user: ${userId}`);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});
*/

// Export placeholder for documentation
module.exports = {
  info: "This is an example Cloud Function for handling Stripe webhooks.",
  instructions: [
    "1. Deploy this function to Firebase Cloud Functions",
    "2. Set the STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET environment variables",
    "3. Configure the webhook endpoint in Stripe Dashboard > Developers > Webhooks",
    "4. Subscribe to events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed",
  ],
}
