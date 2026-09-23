"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "../components/Nav";
import { EVENT_DAYS, formatPrice } from "../../lib/event";
import { PRICING } from "../../lib/passes";

type PassType = "daily" | "season";
type SeasonCategory = "single" | "couple" | "family";

export default function BuyPage() {
  return (
    <Suspense fallback={null}>
      <BuyForm />
    </Suspense>
  );
}

function BuyForm() {
  const params = useSearchParams();
  const cancelled = params.get("cancelled") === "1";

  const [type, setType] = useState<PassType>("daily");
  const [date, setDate] = useState(EVENT_DAYS[0].date);
  const [category, setCategory] = useState<SeasonCategory>("single");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price =
    type === "daily" ? PRICING.daily.priceCents : PRICING.season[category].priceCents;

  async function handleCheckout() {
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          category: type === "season" ? category : undefined,
          date: type === "daily" ? date : undefined,
          name,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="hero-title">Buy Your Pass</h1>
        <p className="hero-sub">Garba Utsav 2026 · Oct 11–19</p>

        {cancelled && (
          <p className="error-text" style={{ textAlign: "center" }}>
            Checkout was cancelled — no charge was made. You can try again below.
          </p>
        )}

        <div className="card">
          <div className="toggle-row">
            <button
              className={type === "daily" ? "active" : ""}
              onClick={() => setType("daily")}
            >
              Daily Pass
            </button>
            <button
              className={type === "season" ? "active" : ""}
              onClick={() => setType("season")}
            >
              Season Pass (all 9 nights)
            </button>
          </div>

          {type === "daily" && (
            <div className="field">
              <label>Which night?</label>
              <select value={date} onChange={(e) => setDate(e.target.value)}>
                {EVENT_DAYS.map((d) => (
                  <option key={d.date} value={d.date}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === "season" && (
            <div className="category-grid">
              {(["single", "couple", "family"] as SeasonCategory[]).map((c) => (
                <div
                  key={c}
                  className={`category-card ${category === c ? "active" : ""}`}
                  onClick={() => setCategory(c)}
                >
                  <div>
                    <div className="name">{c} entry</div>
                    <div className="meta">
                      {PRICING.season[c].capacity}{" "}
                      {PRICING.season[c].capacity === 1 ? "person" : "people"} · all 9
                      nights
                    </div>
                  </div>
                  <div className="price">{formatPrice(PRICING.season[c].priceCents)}</div>
                </div>
              ))}
            </div>
          )}

          <div className="field">
            <label>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="As it should appear on your pass" />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button
            className="btn btn-primary"
            style={{ marginTop: 20 }}
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? "Redirecting to payment…" : `Pay ${formatPrice(price)}`}
          </button>
          <p className="footer-note" style={{ marginTop: 12 }}>
            You'll be redirected to Stripe's secure checkout. Your QR pass is emailed
            and available on the ticket page right after payment.
          </p>
        </div>
      </main>
    </>
  );
}
