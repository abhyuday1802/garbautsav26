import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { priceFor, randomCode, SeasonCategory } from "../../../lib/passes";
import { stripe } from "../../../lib/stripe";

// POST { type: "daily"|"season", category?, date?, name, email }
// -> { url } — redirect the browser to Stripe's hosted checkout page.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, category, date, name, email } = body ?? {};

  if (type !== "daily" && type !== "season") {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }
  if (!name || !email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }
  if (type === "daily" && !date) {
    return NextResponse.json({ error: "date is required for a daily pass" }, { status: 400 });
  }
  if (type === "season" && !category) {
    return NextResponse.json({ error: "category is required for a season pass" }, { status: 400 });
  }

  let pricing;
  try {
    pricing = priceFor(type, category as SeasonCategory);
  } catch (e) {
    return NextResponse.json({ error: "invalid category" }, { status: 400 });
  }

  const code = randomCode();

  const pass = await prisma.pass.create({
    data: {
      code,
      type,
      category: type === "season" ? category : null,
      capacity: pricing.capacity,
      date: type === "daily" ? new Date(date) : null,
      name,
      email,
      priceCents: pricing.priceCents,
      channel: "website",
      paymentMode: "online",
      status: "pending",
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name:
              type === "daily"
                ? `Garba Utsav 2026 — Daily Pass (${date})`
                : `Garba Utsav 2026 — Season Pass (${category})`,
          },
          unit_amount: pricing.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { passId: pass.id, code },
    success_url: `${process.env.APP_URL}/ticket?code=${code}`,
    cancel_url: `${process.env.APP_URL}/buy?cancelled=1`,
  });

  await prisma.pass.update({
    where: { id: pass.id },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({ url: session.url });
}
