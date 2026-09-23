import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

// GET /api/admin/summary — sales overview for the dashboard.
// Header: x-admin-token, checked against ADMIN_TOKEN (deliberately a
// separate secret from STAFF_TOKEN: every counter staffer needs the staff
// token to issue passes, but revenue totals are a smaller circle).
export async function GET(req: NextRequest) {
  const adminToken = req.headers.get("x-admin-token");
  if (!process.env.ADMIN_TOKEN || adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const paidWhere = { status: "paid" as const };

  const [
    totalPaid,
    totalPending,
    revenue,
    byType,
    byCategory,
    byChannel,
    byPaymentMode,
    byCollector,
    recent,
  ] = await Promise.all([
    prisma.pass.count({ where: paidWhere }),
    prisma.pass.count({ where: { status: "pending" } }),
    prisma.pass.aggregate({ where: paidWhere, _sum: { priceCents: true } }),
    prisma.pass.groupBy({
      by: ["type"],
      where: paidWhere,
      _count: { _all: true },
      _sum: { priceCents: true },
    }),
    prisma.pass.groupBy({
      by: ["category"],
      where: { ...paidWhere, type: "season" },
      _count: { _all: true },
      _sum: { priceCents: true },
    }),
    prisma.pass.groupBy({
      by: ["channel"],
      where: paidWhere,
      _count: { _all: true },
      _sum: { priceCents: true },
    }),
    prisma.pass.groupBy({
      by: ["paymentMode"],
      where: paidWhere,
      _count: { _all: true },
      _sum: { priceCents: true },
    }),
    prisma.pass.groupBy({
      by: ["collectedBy"],
      where: { ...paidWhere, paymentMode: "cash" },
      _count: { _all: true },
      _sum: { priceCents: true },
    }),
    prisma.pass.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        code: true,
        type: true,
        category: true,
        name: true,
        phone: true,
        email: true,
        priceCents: true,
        channel: true,
        paymentMode: true,
        collectedBy: true,
        status: true,
        date: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    totalPaid,
    totalPending,
    totalRevenueCents: revenue._sum.priceCents ?? 0,
    byType: byType.map((r) => ({
      type: r.type,
      count: r._count._all,
      revenueCents: r._sum.priceCents ?? 0,
    })),
    byCategory: byCategory.map((r) => ({
      category: r.category,
      count: r._count._all,
      revenueCents: r._sum.priceCents ?? 0,
    })),
    byChannel: byChannel.map((r) => ({
      channel: r.channel,
      count: r._count._all,
      revenueCents: r._sum.priceCents ?? 0,
    })),
    byPaymentMode: byPaymentMode.map((r) => ({
      paymentMode: r.paymentMode,
      count: r._count._all,
      revenueCents: r._sum.priceCents ?? 0,
    })),
    byCollector: byCollector.map((r) => ({
      collectedBy: r.collectedBy ?? "(unspecified)",
      count: r._count._all,
      revenueCents: r._sum.priceCents ?? 0,
    })),
    recent,
  });
}
