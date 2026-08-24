import type { Metadata, Viewport } from "next";
import { Inter, VT323 } from "next/font/google";
import "./globals.css";
import "./blue-theme.css";
import "./cinematic-hero.css";
import "./public-launch.css";
import "./design-excellence.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const terminal = VT323({ weight: "400", subsets: ["latin"], variable: "--font-terminal", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Launch Your Startup in Public | The Anti-Balcony",
    template: "%s | The Anti-Balcony",
  },
  description: "Create a dated public Ring for your startup, share the launch everywhere, and extend the moment to Times Square when it deserves more visibility.",
  applicationName: "The Anti-Balcony",
  keywords: ["startup launch", "launch your startup", "public startup launch", "product launch", "build in public"],
  openGraph: {
    title: "Launch Your Startup in Public | The Anti-Balcony",
    description: "Create a dated public Ring for what you built and share the moment your startup entered the world.",
    type: "website",
    siteName: "The Anti-Balcony",
  },
  twitter: {
    card: "summary_large_image",
    title: "Launch Your Startup in Public | The Anti-Balcony",
    description: "Step out. Ring in your startup.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${terminal.variable}`}>
      <body>{children}</body>
    </html>
  );
}
