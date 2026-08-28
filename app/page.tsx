import type { Metadata } from "next";
import { AntiBalconyV2 } from "@/components/AntiBalconyV2";

export const metadata: Metadata = {
  title: "Celebrate It. Show It. Keep It.",
  description: "Put a proposal, birthday, wedding, declaration of love, milestone or launch in Times Square, then keep proof of the moment after the screen goes dark.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Celebrate it. Show it. Keep it. | The Pop Moment",
    description: "Your moment in Times Square, with proof you can keep.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Celebrate it. Show it. Keep it. | The Pop Moment",
    description: "Your moment in Times Square, with proof you can keep.",
  },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://antibalcony.com";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "The Pop Moment — Times Square Moments",
  url: siteUrl,
  description: "Times Square display moments for proposals, birthdays, weddings, declarations of love, milestones and launches, with proof designed to be kept and shared.",
  provider: {
    "@type": "Organization",
    name: "PlanetHike Project",
  },
  brand: {
    "@type": "Brand",
    name: "The Pop Moment",
  },
  areaServed: "Worldwide",
  serviceType: "Times Square billboard moment and proof package",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AntiBalconyV2 />
    </>
  );
}
