import type { Metadata, Viewport } from "next";
import { Inter, VT323 } from "next/font/google";
import "./globals.css";
import "./blue-theme.css";
import "./cinematic-hero.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const terminal = VT323({ weight: "400", subsets: ["latin"], variable: "--font-terminal", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "The Anti-Balcony — Ring the Internet Bell",
  description: "Ring the Internet Bell, take your launch to Times Square, and leave proof behind.",
  openGraph: {
    title: "The Anti-Balcony — Ring the Internet Bell",
    description: "The internet-native launch ritual for startups that would rather make a moment than ask permission.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Anti-Balcony — Ring the Internet Bell",
    description: "From a free digital bell to a full Times Square launch takeover.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b2341",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${terminal.variable}`}>
      <body>{children}</body>
    </html>
  );
}
