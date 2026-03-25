'use server'
// Stripe Connect will be wired up when Connect is enabled on the Stripe account.
// Partners are routed directly to slots for now.
import { redirect } from 'next/navigation'

export async function initiateStripeConnect() {
  redirect('/partner/onboarding/slots')
}

export async function skipStripeConnect() {
  redirect('/partner/onboarding/slots')
}
