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
import "./pop-moment-v3.css";
import "./pop-moment-card.css";
import "./pop-moment-v4.css";
import "./nasdaq-hero.css";
import "./nasdaq-screen-fit.css";
import "./hero-conversion.css";
import "./pop-moment-natural.css";
import "./admin/admin.css";
import "./booking.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const terminal = VT323({ weight: "400", subsets: ["latin"], variable: "--font-terminal", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://thepopmoment.com"),
  title: { default: "Celebrate It. Show It. Keep It. | The Pop Moment", template: "%s | The Pop Moment" },
  description: "Celebrate a proposal, birthday, wedding, milestone or launch in Times Square, then keep verified proof of the moment after the screen goes dark.",
  applicationName: "The Pop Moment",
  keywords: ["Times Square billboard", "Times Square proposal", "Times Square birthday", "Times Square wedding", "Times Square message", "Times Square moment"],
  openGraph: { title: "Celebrate it. Show it. Keep it. | The Pop Moment", description: "Your moment in Times Square, with proof you can keep.", type: "website", siteName: "The Pop Moment" },
  twitter: { card: "summary_large_image", title: "Celebrate it. Show it. Keep it. | The Pop Moment", description: "Your moment in Times Square, with proof you can keep." },
};

export const viewport: Viewport = { themeColor: "#f7f2e8", colorScheme: "light dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${inter.variable} ${terminal.variable}`}><body><BookingLinkInterceptor />{children}</body></html>;
}
