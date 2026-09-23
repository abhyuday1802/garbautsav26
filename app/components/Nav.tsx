import Link from "next/link";
import { EVENT_NAME } from "../../lib/event";

export default function Nav() {
  return (
    <>
      <div className="lights" />
      <nav className="nav">
        <Link href="/" className="brand">
          {EVENT_NAME}
        </Link>
        <div className="links">
          <Link href="/buy">Buy Pass</Link>
          <Link href="/ticket">My Ticket</Link>
        </div>
      </nav>
    </>
  );
}
