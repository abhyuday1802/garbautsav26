"use client";

import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import { formatPrice, dayLabel } from "../../lib/event";

type Row = { count: number; revenueCents: number };
type Summary = {
  totalPaid: number;
  totalPending: number;
  totalRevenueCents: number;
  byType: (Row & { type: string })[];
  byCategory: (Row & { category: string | null })[];
  byChannel: (Row & { channel: string })[];
  byPaymentMode: (Row & { paymentMode: string })[];
  byCollector: (Row & { collectedBy: string })[];
  recent: {
    code: string;
    type: string;
    category: string | null;
    name: string;
    phone: string | null;
    email: string | null;
    priceCents: number;
    channel: string;
    paymentMode: string;
    collectedBy: string | null;
    status: string;
    date: string | null;
    createdAt: string;
  }[];
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("adminToken");
    if (saved) {
      setToken(saved);
      setUnlocked(true);
    }
  }, []);

  function unlock() {
    if (!token.trim()) return;
    sessionStorage.setItem("adminToken", token.trim());
    setUnlocked(true);
  }

  if (!unlocked) {
    return (
      <>
        <Nav />
        <div className="pin-gate">
          <h1 className="hero-title">Admin Access</h1>
          <p className="hero-sub">Sales dashboard — admin code required</p>
          <div className="field">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin access code"
            />
          </div>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={unlock}>
            Unlock
          </button>
        </div>
      </>
    );
  }

  return (
    <Dashboard
      token={token}
      onSignOut={() => {
        sessionStorage.removeItem("adminToken");
        setUnlocked(false);
      }}
    />
  );
}

function Dashboard({ token, onSignOut }: { token: string; onSignOut: () => void }) {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/summary", {
        headers: { "x-admin-token": token },
      });
      if (res.status === 401) {
        setError("Admin code rejected.");
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Nav />
      <main className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 className="hero-title" style={{ textAlign: "left" }}>
            Sales Dashboard
          </h1>
          <button className="btn btn-secondary" style={{ width: "auto", padding: "8px 14px" }} onClick={onSignOut}>
            Sign out
          </button>
        </div>
        <p className="hero-sub" style={{ textAlign: "left" }}>
          Garba Utsav 2026 — ticketing sales and total collection
        </p>

        {error && <p className="error-text">{error}</p>}
        {loading && <p style={{ color: "var(--cream-dim)" }}>Loading…</p>}

        {data && (
          <>
            <div className="stat-grid">
              <div className="stat-box">
                <div className="label">Total collection</div>
                <div className="value">{formatPrice(data.totalRevenueCents)}</div>
              </div>
              <div className="stat-box">
                <div className="label">Passes sold</div>
                <div className="value">{data.totalPaid}</div>
              </div>
              <div className="stat-box">
                <div className="label">Pending payment</div>
                <div className="value">{data.totalPending}</div>
              </div>
              <div className="stat-box">
                <div className="label">Avg. per pass</div>
                <div className="value">
                  {formatPrice(data.totalPaid ? Math.round(data.totalRevenueCents / data.totalPaid) : 0)}
                </div>
              </div>
            </div>

            <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={load}>
              Refresh
            </button>

            <p className="section-title">By pass type</p>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th className="num">Count</th>
                    <th className="num">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byType.map((r) => (
                    <tr key={r.type}>
                      <td style={{ textTransform: "capitalize" }}>{r.type}</td>
                      <td className="num">{r.count}</td>
                      <td className="num">{formatPrice(r.revenueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="section-title">Season pass category</p>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="num">Count</th>
                    <th className="num">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCategory.map((r) => (
                    <tr key={r.category}>
                      <td style={{ textTransform: "capitalize" }}>{r.category}</td>
                      <td className="num">{r.count}</td>
                      <td className="num">{formatPrice(r.revenueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="section-title">By channel</p>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th className="num">Count</th>
                    <th className="num">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byChannel.map((r) => (
                    <tr key={r.channel}>
                      <td style={{ textTransform: "capitalize" }}>{r.channel}</td>
                      <td className="num">{r.count}</td>
                      <td className="num">{formatPrice(r.revenueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="section-title">By payment mode</p>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th className="num">Count</th>
                    <th className="num">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byPaymentMode.map((r) => (
                    <tr key={r.paymentMode}>
                      <td style={{ textTransform: "capitalize" }}>{r.paymentMode}</td>
                      <td className="num">{r.count}</td>
                      <td className="num">{formatPrice(r.revenueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.byCollector.length > 0 && (
              <>
                <p className="section-title">Cash collected, by staff (reconciliation)</p>
                <div className="table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Staff / seller</th>
                        <th className="num">Passes</th>
                        <th className="num">Cash total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byCollector.map((r) => (
                        <tr key={r.collectedBy}>
                          <td>{r.collectedBy}</td>
                          <td className="num">{r.count}</td>
                          <td className="num">{formatPrice(r.revenueCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <p className="section-title">Recent transactions</p>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Pass</th>
                    <th>Mode</th>
                    <th className="num">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r) => (
                    <tr key={r.code}>
                      <td>{r.code}</td>
                      <td>{r.name}</td>
                      <td>
                        {r.type === "daily" ? `Daily · ${dayLabel(r.date)}` : `Season · ${r.category}`}
                      </td>
                      <td style={{ textTransform: "capitalize" }}>
                        {r.paymentMode}
                        {r.collectedBy ? ` (${r.collectedBy})` : ""}
                      </td>
                      <td className="num">{formatPrice(r.priceCents)}</td>
                      <td style={{ textTransform: "capitalize" }}>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  );
}
