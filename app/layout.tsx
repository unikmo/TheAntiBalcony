import type { Metadata, Viewport } from "next";
import { Inter, VT323 } from "next/font/google";
import { BookingLinkInterceptor } from "@/components/BookingLinkInterceptor";
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
import "./moment-home-v2.css";
import "./booking.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const terminal = VT323({ weight: "400", subsets: ["latin"], variable: "--font-terminal", display: "swap" });

export const metadata: Metadata = {
  // Keep the current live-domain fallback until ThePopMoment.com is registered and attached.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://antibalcony.com"),
  title: {
    default: "Times Square Moments You Can Keep | The Pop Moment",
    template: "%s | The Pop Moment",
  },
  description: "Put a proposal, birthday, wedding, declaration of love, milestone or launch in Times Square, then keep proof of the moment after the screen goes dark.",
  applicationName: "The Pop Moment",
  keywords: ["Times Square billboard", "Times Square proposal", "Times Square birthday", "Times Square wedding", "Times Square message", "Times Square moment"],
  openGraph: {
    title: "Celebrate it. Show it. Keep it. | The Pop Moment",
    description: "Your moment in Times Square, with proof you can keep.",
    type: "website",
    siteName: "The Pop Moment",
  },
  twitter: {
    card: "summary_large_image",
    title: "Celebrate it. Show it. Keep it. | The Pop Moment",
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
      <body>
        <BookingLinkInterceptor />
        {children}
      </body>
    </html>
  );
}
