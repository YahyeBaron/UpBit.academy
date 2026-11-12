import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    message: 'Stripe webhooks are disabled. Primary payment gateway is Sifalo Pay (/api/webhooks/sifalo)',
  });
}
