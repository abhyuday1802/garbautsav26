import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { priceFor, randomCode, SeasonCategory } from "../../../../lib/passes";
import { stripe } from "../../../../lib/stripe";

// POST { type, category?, date?, name, phone, comp?: boolean, sponsor?,
//        mode?: "cash" | "online", collectedBy? }
// Header: x-staff-token — checked against STAFF_TOKEN.
//
// Three ways a staff/counter pass gets settled:
//  - comp: true            -> free, marked paid immediately, sponsor required
//  - mode: "cash"          -> staff collected cash on the spot, marked paid
//                              immediately, collectedBy (staff/seller name) required
//  - mode: "online"        -> not paid yet; we create a real Stripe Checkout
//                              session and return its payment link for staff
//                              to send to the buyer's phone. The pass stays
//                              "pending" until Stripe's webhook confirms it,
//                              same as a website purchase.
//
// This is a placeholder auth model: one shared token in an env var, good
// enough for a small team at a single gate. For more than a couple of
// staff accounts, swap this for real per-user auth (e.g. NextAuth with a
// staff/admin role) before relying on it.
export async function POST(req: NextRequest) {
  const staffToken = req.headers.get("x-staff-token");
  if (staffToken !== process.env.STAFF_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { type, category, date, name, phone, comp, sponsor, mode, collectedBy } =
    await req.json();

  if (type !== "daily" && type !== "season") {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }
  if (!name || !phone) {
    return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
  }
  if (comp && !sponsor) {
    return NextResponse.json({ error: "sponsor/reason is required for comp passes" }, { status: 400 });
  }
  if (!comp && mode === "cash" && !collectedBy) {
    return NextResponse.json({ error: "collectedBy (staff/seller name) is required for cash payments" }, { status: 400 });
  }
  if (!comp && mode !== "cash" && mode !== "online") {
    return NextResponse.json({ error: "mode must be 'cash' or 'online' (or comp: true)" }, { status: 400 });
  }

  let pricing;
  try {
    pricing = priceFor(type, category as SeasonCategory);
  } catch {
    return NextResponse.json({ error: "invalid category" }, { status: 400 });
  }

  const code = randomCode();

  // Comp and cash both settle immediately, outside Stripe.
  if (comp || mode === "cash") {
    const pass = await prisma.pass.create({
      data: {
        code,
        type,
        category: type === "season" ? category : null,
        capacity: pricing.capacity,
        date: type === "daily" ? new Date(date) : null,
        name,
        phone,
        priceCents: comp ? 0 : pricing.priceCents,
        channel: comp ? "comp" : "counter",
        paymentMode: comp ? "free" : "cash",
        collectedBy: comp ? null : collectedBy,
        sponsor: comp ? sponsor : null,
        // Settled outside Stripe (free, or cash in hand), so mark paid now
        // rather than pending.
        status: "paid",
      },
    });

    return NextResponse.json({
      code: pass.code,
      status: "paid",
      // The buyer-facing ticket link staff can copy into an SMS/WhatsApp message.
      link: `${process.env.APP_URL}/ticket?code=${pass.code}`,
    });
  }

  // mode === "online": create a pending pass and a real Stripe Checkout
  // session, same shape as a website purchase, so the webhook marks it
  // paid the moment the buyer actually pays.
  const pass = await prisma.pass.create({
    data: {
      code,
      type,
      category: type === "season" ? category : null,
      capacity: pricing.capacity,
      date: type === "daily" ? new Date(date) : null,
      name,
      phone,
      priceCents: pricing.priceCents,
      channel: "counter",
      paymentMode: "online",
      status: "pending",
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    phone_number_collection: { enabled: true },
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
    cancel_url: `${process.env.APP_URL}/staff?cancelled=1`,
  });

  await prisma.pass.update({
    where: { id: pass.id },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({
    code: pass.code,
    status: "pending",
    // A real Stripe payment link — send this to the buyer's phone to
    // complete payment. The pass isn't valid at the gate until they pay.
    link: session.url,
  });
}
