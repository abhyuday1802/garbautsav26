import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "../../../lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Stripe calls this directly — never trust the browser to report payment
// success. Configure this URL as a webhook endpoint in the Stripe
// dashboard, listening for "checkout.session.completed".
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const passId = session.metadata?.passId;
    if (passId) {
      await prisma.pass.update({
        where: { id: passId },
        data: { status: "paid" },
      });
    }
  }

  return NextResponse.json({ received: true });
}

// Note: this is an App Router route handler, so req.text() above already
// gives the raw, unparsed body Stripe's signature check needs — no extra
// config needed (that's only required in the older Pages Router).
