import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

// POST { code, gateDate: "YYYY-MM-DD", admit?: number }
// `admit` is only used for season passes on a second call, once the guard
// has chosen a headcount (1..remaining) in the UI.
export async function POST(req: NextRequest) {
  const staffToken = req.headers.get("x-staff-token");
  if (staffToken !== process.env.STAFF_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { code, gateDate, admit } = await req.json();
  if (!code || !gateDate) {
    return NextResponse.json({ error: "code and gateDate are required" }, { status: 400 });
  }

  const pass = await prisma.pass.findUnique({
    where: { code: String(code).toUpperCase() },
    include: { checkins: { where: { date: gateDate } } },
  });

  if (!pass || pass.status !== "paid") {
    return NextResponse.json({ result: "invalid" });
  }

  if (pass.type === "daily") {
    const passDate = pass.date?.toISOString().slice(0, 10);
    if (passDate !== gateDate) {
      return NextResponse.json({ result: "wrong_day", validDate: passDate, name: pass.name });
    }
    const existing = pass.checkins[0];
    if (existing) {
      return NextResponse.json({ result: "already_used", name: pass.name, at: existing.updatedAt });
    }
    await prisma.checkin.create({ data: { passId: pass.id, date: gateDate, count: 1 } });
    return NextResponse.json({ result: "granted", name: pass.name, type: "daily" });
  }

  // season pass: per-day headcount up to capacity
  const existing = pass.checkins[0];
  const today = existing?.count ?? 0;
  const remaining = pass.capacity - today;

  if (remaining <= 0) {
    return NextResponse.json({ result: "day_full", name: pass.name, capacity: pass.capacity, category: pass.category });
  }

  if (!admit) {
    // First call: report status so the UI can show the stepper.
    return NextResponse.json({
      result: "pending_admit",
      name: pass.name,
      category: pass.category,
      capacity: pass.capacity,
      enteredToday: today,
      remaining,
    });
  }

  const admitN = Math.max(1, Math.min(Number(admit), remaining));
  const newCount = today + admitN;
  await prisma.checkin.upsert({
    where: { passId_date: { passId: pass.id, date: gateDate } },
    create: { passId: pass.id, date: gateDate, count: newCount },
    update: { count: newCount },
  });

  return NextResponse.json({
    result: "granted",
    name: pass.name,
    type: "season",
    admitted: admitN,
    enteredToday: newCount,
    capacity: pass.capacity,
  });
}
