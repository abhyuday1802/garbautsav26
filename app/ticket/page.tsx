"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import Nav from "../components/Nav";
import { dayLabel } from "../../lib/event";

type Pass = {
  code: string;
  type: "daily" | "season";
  category: string | null;
  capacity: number;
  date: string | null;
  name: string;
  status: "pending" | "paid" | "void";
  channel: string;
  paymentMode: string;
  createdAt: string;
};

export default function TicketPage() {
  return (
    <Suspense fallback={null}>
      <TicketLookup />
    </Suspense>
  );
}

function TicketLookup() {
  const params = useSearchParams();
  const initialCode = params.get("code") || "";
  const [codeInput, setCodeInput] = useState(initialCode);
  const [pass, setPass] = useState<Pass | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function lookup(code: string) {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setPass(null);
    try {
      const res = await fetch(`/api/pass/${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError("No pass found with that code.");
      } else {
        setPass(data.pass);
        const url = await QRCode.toDataURL(data.pass.code, { width: 360, margin: 1 });
        setQrUrl(url);
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialCode) lookup(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  async function downloadImage() {
    if (!pass || !qrUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 520;
    canvas.height = 700;
    ctx.fillStyle = "#f7ecd2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#3a0a10";
    ctx.font = "bold 26px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("Garba Utsav 2026", canvas.width / 2, 50);
    ctx.font = "16px Georgia";
    ctx.fillText(pass.name, canvas.width / 2, 82);

    const img = new Image();
    img.src = qrUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    ctx.drawImage(img, canvas.width / 2 - 180, 110, 360, 360);

    ctx.font = "bold 24px monospace";
    ctx.fillText(pass.code, canvas.width / 2, 510);

    ctx.font = "15px Georgia";
    const line2 =
      pass.type === "daily"
        ? `Daily Pass · ${dayLabel(pass.date)}`
        : `Season Pass · ${pass.category}`;
    ctx.fillText(line2, canvas.width / 2, 545);
    ctx.fillText(pass.status === "paid" ? "PAID · VALID" : "PAYMENT PENDING", canvas.width / 2, 575);

    const link = document.createElement("a");
    link.download = `garba-utsav-2026-${pass.code}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <>
      <Nav />
      <main className="container">
        <h1 className="hero-title">My Ticket</h1>
        <p className="hero-sub">Look up your pass by its code</p>

        <div className="card">
          <div className="field">
            <label>Pass code</label>
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="ABCD-1234"
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 14 }}
            onClick={() => lookup(codeInput)}
            disabled={loading}
          >
            {loading ? "Looking up…" : "Find my pass"}
          </button>
          {error && <p className="error-text">{error}</p>}
        </div>

        {pass && (
          <div className="ticket">
            <div className="ticket-top">
              <div className="ticket-notch left" />
              <div className="ticket-notch right" />
              <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20 }}>
                Garba Utsav 2026
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13, opacity: 0.7 }}>{pass.name}</p>
              {qrUrl && (
                <div className="qr-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt="Entry QR code" width={200} height={200} />
                </div>
              )}
              <div className="ticket-code">{pass.code}</div>
              <span className={`badge ${pass.status === "paid" ? "badge-paid" : "badge-pending"}`}>
                {pass.status === "paid" ? "Valid" : "Payment pending"}
              </span>
            </div>
            <div className="ticket-bottom">
              <div className="ticket-row">
                <span>Type</span>
                <span>{pass.type === "daily" ? "Daily Pass" : "Season Pass"}</span>
              </div>
              {pass.type === "daily" ? (
                <div className="ticket-row">
                  <span>Valid on</span>
                  <span>{dayLabel(pass.date)}</span>
                </div>
              ) : (
                <>
                  <div className="ticket-row">
                    <span>Category</span>
                    <span style={{ textTransform: "capitalize" }}>{pass.category}</span>
                  </div>
                  <div className="ticket-row">
                    <span>Valid on</span>
                    <span>All 9 nights, Oct 11–19</span>
                  </div>
                  <div className="ticket-row">
                    <span>Admits</span>
                    <span>up to {pass.capacity} per night</span>
                  </div>
                </>
              )}
              <div className="ticket-row">
                <span>Payment</span>
                <span style={{ textTransform: "capitalize" }}>
                  {pass.paymentMode === "free" ? "Complimentary" : pass.paymentMode}
                </span>
              </div>
              <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={downloadImage}>
                Save ticket image
              </button>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </main>
    </>
  );
}
