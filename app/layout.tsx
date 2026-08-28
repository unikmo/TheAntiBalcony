import type { Metadata, Viewport } from "next";
import { Inter, VT323 } from "next/font/google";
import { IS_PREVIEW, SITE_DESCRIPTION, SITE_URL } from "@/lib/discovery";
import "./globals.css";
import "./blue-theme.css";
import "./cinematic-hero.css";
import "./public-launch.css";
import "./design-excellence.css";
import "./site-pages-excellence.css";
import "./navigation-responsive.css";
import "./cinematic-brand.css";
import "./legal-and-record.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const terminal = VT323({ weight: "400", subsets: ["latin"], variable: "--font-terminal", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Pop Moment by UNIKMO",
    template: "%s | The Pop Moment",
  },
  description: SITE_DESCRIPTION,
  robots: IS_PREVIEW ? { index: false, follow: false } : undefined,
  applicationName: "The Pop Moment",
  keywords: ["celebration film", "milestone memory", "UNIKMO card", "Times Square moment"],
  openGraph: {
    title: "The Pop Moment by UNIKMO",
    description: "Celebrate it. Show it. Keep it.",
    type: "website",
    siteName: "The Pop Moment",
  },
  twitter: {
    card: "summary",
    title: "The Pop Moment by UNIKMO",
    description: "Celebrate it. Show it. Keep it.",
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
