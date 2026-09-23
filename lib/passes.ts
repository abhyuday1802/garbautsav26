// Central place for pricing and capacity so the checkout route, the
// staff-issue route, and (eventually) the frontend all agree.

// Prices are in paise (INR minor unit), placeholders — adjust to the
// organizers' real pricing before going live.
export const PRICING = {
  daily: { capacity: 1, priceCents: 20000 }, // ₹200
  season: {
    single: { capacity: 1, priceCents: 150000 }, // ₹1,500
    couple: { capacity: 2, priceCents: 280000 }, // ₹2,800
    family: { capacity: 4, priceCents: 500000 }, // ₹5,000
  },
} as const;

export function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s.slice(0, 4) + "-" + s.slice(4);
}

export type SeasonCategory = keyof typeof PRICING.season;

export function priceFor(
  type: "daily" | "season",
  category?: SeasonCategory
): { priceCents: number; capacity: number } {
  if (type === "daily") return PRICING.daily;
  if (!category || !(category in PRICING.season)) {
    throw new Error("season passes require a valid category");
  }
  return PRICING.season[category];
}
