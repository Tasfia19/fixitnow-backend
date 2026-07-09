import Stripe from 'stripe';
import { config } from '../config';

// Initialize Stripe Client
export const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2023-10-16' as any, // standard API version
});

export const createCheckoutSession = async (bookingId: string, amount: number, serviceName: string, txnId: string) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `FixItNow - ${serviceName}`,
            description: `Payment for booking ref: ${bookingId}`,
          },
          unit_amount: Math.round(amount * 100), // convert to cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    // We point to general placeholders since this is a backend-only REST API
    success_url: `https://example.com/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
    cancel_url: `https://example.com/payment-cancel?booking_id=${bookingId}`,
    client_reference_id: bookingId,
    metadata: {
      bookingId,
      transactionId: txnId,
    },
  });

  return session;
};

export const retrieveCheckoutSession = async (sessionId: string) => {
  return await stripe.checkout.sessions.retrieve(sessionId);
};
