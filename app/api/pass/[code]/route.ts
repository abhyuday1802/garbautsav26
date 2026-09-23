import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

// GET /api/pass/ABCD-1234 -> safe, public subset of a pass's details.
// Used by the ticket page to render the QR + status after checkout, and by
// staff to double-check a code by hand if the scanner is unavailable.
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code?.toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  const pass = await prisma.pass.findUnique({
    where: { code },
    select: {
      code: true,
      type: true,
      category: true,
      capacity: true,
      date: true,
      name: true,
      status: true,
      channel: true,
      paymentMode: true,
      createdAt: true,
    },
  });

  if (!pass) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ pass });
}
