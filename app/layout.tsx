import type { Metadata, Viewport } from "next";
import { Inter, VT323 } from "next/font/google";
import "./globals.css";
import "./blue-theme.css";
import "./cinematic-hero.css";
import "./public-launch.css";
import "./design-excellence.css";
import "./site-pages-excellence.css";
import "./navigation-responsive.css";
import "./cinematic-brand.css";
import "./legal-and-record.css";
import "./moment-home.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const terminal = VT323({ weight: "400", subsets: ["latin"], variable: "--font-terminal", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://antibalcony.com"),
  title: {
    default: "Times Square Moments You Can Keep | The Anti-Balcony",
    template: "%s | The Anti-Balcony",
  },
  description: "Put a proposal, birthday, wedding, declaration of love, milestone or launch in Times Square, then keep proof of the moment after the screen goes dark.",
  applicationName: "The Anti-Balcony",
  keywords: ["Times Square billboard", "Times Square proposal", "Times Square birthday", "Times Square wedding", "Times Square message", "startup launch"],
  openGraph: {
    title: "Celebrate it. Show it. Keep it. | The Anti-Balcony",
    description: "Your moment in Times Square, with proof you can keep.",
    type: "website",
    siteName: "The Anti-Balcony",
  },
  twitter: {
    card: "summary_large_image",
    title: "Celebrate it. Show it. Keep it.",
    description: "Your moment in Times Square, with proof you can keep.",
  },
};

export const viewport: Viewport = {
  themeColor: "#070707",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${terminal.variable}`}>
      <body>{children}</body>
    </html>
  );
}
