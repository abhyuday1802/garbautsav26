"use client";

import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import { EVENT_DAYS } from "../../lib/event";

type PassType = "daily" | "season";
type SeasonCategory = "single" | "couple" | "family";
type Mode = "cash" | "online";

export default function StaffPage() {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("staffToken");
    if (saved) {
      setToken(saved);
      setUnlocked(true);
    }
  }, []);

  function unlock() {
    if (!token.trim()) return;
    sessionStorage.setItem("staffToken", token.trim());
    setUnlocked(true);
  }

  if (!unlocked) {
    return (
      <>
        <Nav />
        <div className="pin-gate">
          <h1 className="hero-title">Counter Access</h1>
          <p className="hero-sub">Staff access code required</p>
          <div className="field">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Staff access code"
            />
          </div>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={unlock}>
            Unlock
          </button>
        </div>
      </>
    );
  }

  return <IssueForm token={token} />;
}

function IssueForm({ token }: { token: string }) {
  const [type, setType] = useState<PassType>("daily");
  const [category, setCategory] = useState<SeasonCategory>("single");
  const [date, setDate] = useState(EVENT_DAYS[0].date);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comp, setComp] = useState(false);
  const [sponsor, setSponsor] = useState("");
  const [mode, setMode] = useState<Mode>("cash");
  const [collectedBy, setCollectedBy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ code: string; link: string; status: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone number are required.");
      return;
    }
    if (comp && !sponsor.trim()) {
      setError("Sponsor / reason is required for a complimentary pass.");
      return;
    }
    if (!comp && mode === "cash" && !collectedBy.trim()) {
      setError("Enter which staff member collected the cash.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/staff/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-staff-token": token },
        body: JSON.stringify({
          type,
          category: type === "season" ? category : undefined,
          date: type === "daily" ? date : undefined,
          name,
          phone,
          comp,
          sponsor: comp ? sponsor : undefined,
          mode: comp ? undefined : mode,
          collectedBy: !comp && mode === "cash" ? collectedBy : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setBusy(false);
        return;
      }
      setIssued(data);
      setName("");
      setPhone("");
      setSponsor("");
      setCollectedBy("");
      setComp(false);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const submitLabel = comp
    ? "Issue complimentary pass"
    : mode === "cash"
    ? "Issue pass — cash collected"
    : "Generate online payment link";

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="hero-title">Counter Passes</h1>
        <p className="hero-sub">Issue a pass — cash in hand, an online link, or complimentary</p>

        <div className="card">
          <div className="toggle-row">
            <button className={type === "daily" ? "active" : ""} onClick={() => setType("daily")}>
              Daily Pass
            </button>
            <button className={type === "season" ? "active" : ""} onClick={() => setType("season")}>
              Season Pass
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
            <div className="field">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as SeasonCategory)}>
                <option value="single">Single entry</option>
                <option value="couple">Couple entry (2)</option>
                <option value="family">Family entry (4)</option>
              </select>
            </div>
          )}

          <div className="field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="For sharing the ticket / payment link" />
          </div>

          <div className="field" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              id="comp"
              checked={comp}
              onChange={(e) => setComp(e.target.checked)}
              style={{ width: "auto" }}
            />
            <label htmlFor="comp" style={{ margin: 0 }}>
              Complimentary — no charge (sponsors, VIP guests)
            </label>
          </div>

          {comp && (
            <div className="field">
              <label>Sponsor / reason (required)</label>
              <input value={sponsor} onChange={(e) => setSponsor(e.target.value)} placeholder="e.g. Shivnath Vatika, VIP guest" />
            </div>
          )}

          {!comp && (
            <div className="field">
              <label>Payment mode</label>
              <div className="toggle-row">
                <button className={mode === "cash" ? "active" : ""} onClick={() => setMode("cash")}>
                  Cash at counter
                </button>
                <button className={mode === "online" ? "active" : ""} onClick={() => setMode("online")}>
                  Online payment link
                </button>
              </div>
            </div>
          )}

          {!comp && mode === "cash" && (
            <div className="field">
              <label>Collected by (staff/seller name, required)</label>
              <input value={collectedBy} onChange={(e) => setCollectedBy(e.target.value)} placeholder="Your name" />
            </div>
          )}

          {!comp && mode === "online" && (
            <p style={{ fontSize: 12.5, color: "var(--cream-dim)", marginTop: 10 }}>
              This creates a real Stripe payment link — the pass stays pending until
              the buyer actually pays. Share the link by SMS or WhatsApp.
            </p>
          )}

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={submit} disabled={busy}>
            {busy ? "Issuing…" : submitLabel}
          </button>
        </div>

        {issued && (
          <div className="card">
            <p style={{ textAlign: "center", margin: 0 }}>
              {issued.status === "paid" ? "Pass issued and paid" : "Payment link created"}
            </p>
            <p className="ticket-code" style={{ textAlign: "center" }}>
              {issued.code}
            </p>
            {issued.status !== "paid" && (
              <p style={{ fontSize: 12.5, textAlign: "center", color: "var(--cream-dim)" }}>
                Not valid at the gate until this is paid.
              </p>
            )}
            <p style={{ fontSize: 13, textAlign: "center", wordBreak: "break-all", color: "var(--cream-dim)" }}>
              {issued.link}
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => navigator.clipboard.writeText(issued.link)}
            >
              Copy link to share by SMS / WhatsApp
            </button>
          </div>
        )}
      </main>
    </>
  );
}
