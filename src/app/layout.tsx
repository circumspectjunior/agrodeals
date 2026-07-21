import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, Space_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import "./globals.css";

// Explicit so real phone browsers always lay out at device width (rather
// than defaulting to a ~980px desktop viewport and shrinking the page).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Display — warm, high-character old-style serif (headings/hero). This is
// the LCP element on most pages, so it's explicitly preloaded and gets
// first claim on early bandwidth.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

// Body — friendly humanist sans, highly legible on low-end phones. Used
// everywhere, so it's preloaded too.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

// Manifest — the factual voice (eyebrow labels + data values). Secondary
// to the display/body faces, so it's not preloaded — that leaves early
// bandwidth for the LCP display font. It swaps in a moment later without
// shifting layout.
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "AgroDeal",
  description: "Direct-trade cocoa, traceable to the farm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} ${spaceMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
