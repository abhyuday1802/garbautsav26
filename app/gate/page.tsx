"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import Nav from "../components/Nav";
import { EVENT_DAYS } from "../../lib/event";

type ScanResult = {
  result: string;
  name?: string;
  category?: string;
  capacity?: number;
  enteredToday?: number;
  remaining?: number;
  validDate?: string;
  admitted?: number;
  type?: string;
};

export default function GatePage() {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("staffToken");
    if (saved) {
      setToken(saved);
      setUnlocked(true);
    }
  }, []);

  function unlock() {
    if (!token.trim()) {
      setPinError("Enter the staff access code.");
      return;
    }
    sessionStorage.setItem("staffToken", token.trim());
    setUnlocked(true);
    setPinError(null);
  }

  if (!unlocked) {
    return (
      <>
        <Nav />
        <div className="pin-gate">
          <h1 className="hero-title">Gate Access</h1>
          <p className="hero-sub">Staff access code required</p>
          <div className="field">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Staff access code"
            />
          </div>
          {pinError && <p className="error-text">{pinError}</p>}
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={unlock}>
            Unlock
          </button>
        </div>
      </>
    );
  }

  return <GateScanner token={token} onSignOut={() => { sessionStorage.removeItem("staffToken"); setUnlocked(false); }} />;
}

function GateScanner({ token, onSignOut }: { token: string; onSignOut: () => void }) {
  const [gateDate, setGateDate] = useState(EVENT_DAYS[0].date);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [pending, setPending] = useState<{ code: string; data: ScanResult } | null>(null);
  const [admitN, setAdmitN] = useState(1);
  const [lastResult, setLastResult] = useState<{ code: string; data: ScanResult } | null>(null);
  const [log, setLog] = useState<{ code: string; result: string; name?: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  async function callScan(code: string, admit?: number) {
    setBusy(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-staff-token": token },
        body: JSON.stringify({ code, gateDate, admit }),
      });
      const data: ScanResult = await res.json();

      if (res.status === 401) {
        setLastResult({ code, data: { result: "unauthorized" } });
        setBusy(false);
        return;
      }

      if (data.result === "pending_admit") {
        setPending({ code, data });
        setAdmitN(1);
      } else {
        setPending(null);
        setLastResult({ code, data });
        setLog((l) => [{ code, result: data.result, name: data.name }, ...l].slice(0, 20));
      }
    } catch {
      setLastResult({ code, data: { result: "network_error" } });
    } finally {
      setBusy(false);
    }
  }

  function confirmAdmit() {
    if (!pending) return;
    callScan(pending.code, admitN);
  }

  function handleManualSubmit() {
    if (!manualCode.trim()) return;
    callScan(manualCode.trim().toUpperCase());
    setManualCode("");
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      tick();
    } catch {
      setLastResult({ code: "", data: { result: "camera_error" } });
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setScanning(false);
  }

  function tick() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height);
        if (code && code.data && !pending && !busy) {
          callScan(code.data.trim().toUpperCase());
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => () => stopCamera(), []);

  const resultLabel: Record<string, string> = {
    invalid: "Invalid code — not found or unpaid",
    wrong_day: "Wrong day for this daily pass",
    already_used: "Already used today",
    day_full: "Capacity reached for today",
    granted: "Entry granted",
    unauthorized: "Staff code rejected",
    network_error: "Could not reach the server",
    camera_error: "Camera unavailable — use manual entry",
  };

  return (
    <>
      <Nav />
      <main className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 className="hero-title" style={{ textAlign: "left" }}>
            Gate Scanner
          </h1>
          <button className="btn btn-secondary" style={{ width: "auto", padding: "8px 14px" }} onClick={onSignOut}>
            Sign out
          </button>
        </div>

        <div className="card">
          <div className="field">
            <label>Tonight's date</label>
            <select value={gateDate} onChange={(e) => setGateDate(e.target.value)}>
              {EVENT_DAYS.map((d) => (
                <option key={d.date} value={d.date}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {!scanning ? (
            <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={startCamera}>
              Start camera scan
            </button>
          ) : (
            <>
              <video ref={videoRef} className="scanner" muted playsInline />
              <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={stopCamera}>
                Stop camera
              </button>
            </>
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          <div className="field">
            <label>Or enter code manually</label>
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="ABCD-1234"
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            />
          </div>
          <button className="btn btn-secondary" onClick={handleManualSubmit} disabled={busy}>
            Check code
          </button>
        </div>

        {pending && (
          <div className="card">
            <p style={{ margin: 0, textAlign: "center" }}>
              <strong>{pending.data.name}</strong> · {pending.data.category} pass
              <br />
              Entered so far tonight: {pending.data.enteredToday} of {pending.data.capacity}
            </p>
            <div className="stepper">
              <button onClick={() => setAdmitN((n) => Math.max(1, n - 1))}>−</button>
              <span className="count">{admitN}</span>
              <button
                onClick={() => setAdmitN((n) => Math.min(pending.data.remaining ?? 1, n + 1))}
              >
                +
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--cream-dim)" }}>
              admitting now, up to {pending.data.remaining} remaining
            </p>
            <button className="btn btn-primary" onClick={confirmAdmit} disabled={busy}>
              Admit {admitN}
            </button>
          </div>
        )}

        {lastResult && (
          <div className={`result-banner ${lastResult.data.result === "granted" ? "result-granted" : "result-error"}`}>
            {resultLabel[lastResult.data.result] || lastResult.data.result}
            {lastResult.data.name && (
              <div style={{ fontSize: 13, marginTop: 4, fontWeight: 400 }}>
                {lastResult.data.name}
                {lastResult.data.admitted ? ` · admitted ${lastResult.data.admitted}` : ""}
              </div>
            )}
          </div>
        )}

        {log.length > 0 && (
          <div className="scan-log">
            <p style={{ color: "var(--cream-dim)", fontSize: 12.5 }}>Recent scans tonight</p>
            {log.map((l, i) => (
              <div className="row" key={i}>
                <span>{l.code}</span>
                <span>{l.name || resultLabel[l.result] || l.result}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
