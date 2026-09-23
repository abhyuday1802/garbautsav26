import Link from "next/link";
import Nav from "./components/Nav";
import {
  EVENT_NAME,
  EVENT_SUBTITLE,
  EVENT_TAGLINE,
  PRESENTED_BY,
  PRESENTED_BY_LINE,
  TITLE_SPONSOR,
  ORGANIZER,
  ORGANIZER_LOCATION,
} from "../lib/event";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="container center">
        <p className="tagline">{PRESENTED_BY} presents</p>

        <div className="medallion">
          <div className="txt">
            <span className="sm">GARBA</span>
            <span className="lg">Utsav</span>
            <span className="yr">2026</span>
          </div>
        </div>

        <h1 className="hero-title">{EVENT_NAME}</h1>
        <p className="hero-sub">{EVENT_SUBTITLE}</p>
        <p className="tagline" style={{ marginTop: 10 }}>
          {EVENT_TAGLINE}
        </p>

        <div className="date-chip">
          <span className="big">11</span>
          <span className="mid">to</span>
          <span className="big">19</span>
          <span className="mid">Oct</span>
        </div>

        <div style={{ width: "100%", marginTop: 32 }}>
          <Link href="/buy" className="btn btn-primary" style={{ display: "block" }}>
            Buy Your Pass
          </Link>
          <Link
            href="/ticket"
            className="btn btn-secondary"
            style={{ display: "block", marginTop: 10 }}
          >
            I already have a pass
          </Link>
        </div>

        <div className="sponsor-card" style={{ width: "100%" }}>
          <div className="label">We're delighted to announce our Title Sponsor</div>
          <div className="name">{TITLE_SPONSOR}</div>
        </div>

        <div className="card" style={{ width: "100%", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--cream-dim)" }}>
            Presented by
          </p>
          <h3 style={{ marginTop: 4, color: "var(--gold-bright)" }}>{PRESENTED_BY}</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--cream-dim)" }}>
            {PRESENTED_BY_LINE}
          </p>
        </div>

        <p className="footer-note">
          Organized by <strong>{ORGANIZER}</strong>
          <br />
          {ORGANIZER_LOCATION}
        </p>

        <p className="small-link">
          Staff? <Link href="/gate">Gate scanner</Link> ·{" "}
          <Link href="/staff">Counter / comp passes</Link> ·{" "}
          <Link href="/admin">Admin dashboard</Link>
        </p>
      </main>
    </>
  );
}
