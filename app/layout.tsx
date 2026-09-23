import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display-loaded",
});

const body = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body-loaded",
});

export const metadata: Metadata = {
  title: "Garba Utsav 2026 — Entry Passes",
  description:
    "Sun Group presents Garba Utsav 2026, Oct 11–19, organized by Sanskardhani Garba Utsav Group, Rajnandgaon (C.G.). Title Sponsor: Shivnath Vatika. Buy your daily or season entry pass.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
