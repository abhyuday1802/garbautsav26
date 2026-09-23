// Branding + event data pulled from the official poster. Keep this as the
// single source of truth so a copy change only has to happen in one place.

export const EVENT_NAME = "Garba Utsav 2026";
export const EVENT_SUBTITLE = "Garba Night 2026";
export const EVENT_TAGLINE = "10 years. One rhythm. One legacy.";
export const PRESENTED_BY = "Sun Group";
export const PRESENTED_BY_LINE = "For a Better Tomorrow";
export const TITLE_SPONSOR = "Shivnath Vatika";
export const ORGANIZER = "Sanskardhani Garba Utsav Group";
export const ORGANIZER_LOCATION = "Rajnandgaon (C.G.)";
export const DATE_RANGE_LABEL = "11 to 19 Oct";
export const CURRENCY = "inr";
export const CURRENCY_SYMBOL = "\u20B9";

// Nine nights, Oct 11–19, 2026.
export const EVENT_DAYS = [
  { date: "2026-10-11", label: "Day 1 · Sun, Oct 11" },
  { date: "2026-10-12", label: "Day 2 · Mon, Oct 12" },
  { date: "2026-10-13", label: "Day 3 · Tue, Oct 13" },
  { date: "2026-10-14", label: "Day 4 · Wed, Oct 14" },
  { date: "2026-10-15", label: "Day 5 · Thu, Oct 15" },
  { date: "2026-10-16", label: "Day 6 · Fri, Oct 16" },
  { date: "2026-10-17", label: "Day 7 · Sat, Oct 17" },
  { date: "2026-10-18", label: "Day 8 · Sun, Oct 18" },
  { date: "2026-10-19", label: "Day 9 · Mon, Oct 19" },
] as const;

export function formatPrice(cents: number): string {
  return `${CURRENCY_SYMBOL}${(cents / 100).toLocaleString("en-IN")}`;
}

export function dayLabel(dateStr: string | null): string {
  if (!dateStr) return "";
  const found = EVENT_DAYS.find((d) => d.date === dateStr);
  return found ? found.label : dateStr;
}
