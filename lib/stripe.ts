import Stripe from 'stripe';
import { env } from '@/lib/env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const createCheckoutSession = async (params: {
  priceId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}) => {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    customer: params.customerId,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session;
};

export const createCustomerPortalSession = async (
  customerId: string,
  returnUrl: string
) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
};
