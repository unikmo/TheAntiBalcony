import type { Metadata, Viewport } from "next";
import { Inter, VT323 } from "next/font/google";
import "./globals.css";
import "./takeover-overrides.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const terminal = VT323({ weight: "400", subsets: ["latin"], variable: "--font-terminal", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "The Anti-Balcony — Ring the Internet Bell",
  description: "The internet-native launch ritual for startups that do not need Wall Street's balcony.",
  openGraph: {
    title: "The Anti-Balcony",
    description: "Ring the Internet Bell. A launch ritual for the rest of us.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Anti-Balcony",
    description: "Ring the Internet Bell. A launch ritual for the rest of us.",
  },
};

export const viewport: Viewport = {
  themeColor: "#070707",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${terminal.variable}`}>
      <body>{children}</body>
    </html>
  );
}
