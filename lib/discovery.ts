import type { Metadata } from "next";
import { money, POP_OFFERS } from "./pop-offers";

// Canonicals identify the owned production site, never the incoming Host header.
// A future domain move needs its own redirects and release approval.
export function canonicalOrigin(value = process.env.NEXT_PUBLIC_SITE_URL) {
  if (!value) return "https://antibalcony.com";
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a bare HTTP(S) site origin.");
  }
  return url.origin;
}

export const SITE_URL = canonicalOrigin();
export const SITE_NAME = "The Pop Moment";
export const IS_PREVIEW = process.env.VERCEL_ENV === "preview";
export const SITE_DESCRIPTION = "The Pop Moment brings your celebration to Times Square through request-only NASDAQ experiences, with curated films and UNIKMO keepsakes. For company milestones, weddings, birthdays and achievements. An AntiBalcony experience; booking and licensed capture require confirmation.";
export const absoluteUrl = (path: string) => new URL(path, `${SITE_URL}/`).toString();

export function pageMetadata(title: string, description: string, path: string, index = true): Metadata {
  return {
    title, description,
    alternates: { canonical: absoluteUrl(path) },
    robots: { index: index && !IS_PREVIEW, follow: true },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url: absoluteUrl(path), siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary", title: `${title} | ${SITE_NAME}`, description },
  };
}

// Same answers in rendered HTML, JSON-LD and the optional text index.
export const POP_FAQS = [
  { question: "What is The Pop Moment?", answer: SITE_DESCRIPTION },
  { question: "Do you send a bell, confetti or a camera crew?", answer: "No. You choose your celebration and arrange any props or filming. We provide direction and a capture guide; the paid experiences include editing your supplied footage." },
  { question: "Where does my free video live?", answer: "On the social platform where you posted it. Submit its public link, not the file. After review, your moment page links people to it. We do not copy or archive the free video; removing the original makes that video unavailable." },
  { question: "Will you share my POP on social?", answer: "Only with your opt-in permission, and only if selected. Your benefit is the capture guide and a shareable moment page—not a promise of views or a guaranteed feature." },
  { question: "What do the experiences cost?", answer: `POP is free. Keep it is ${money(POP_OFFERS.keep.cents)} USD for creative direction, a curated 30–45 second film, one revision and one UNIKMO card. Go public is ${money(POP_OFFERS.nasdaq.cents)} USD for Keep it plus a requested 15-second NASDAQ appearance and licensed display footage. Paid prices exclude applicable tax and delivery. Final scope and quote are confirmed before payment.` },
  { question: "Is Times Square ready to book?", answer: "Not yet. You can send a request, but we must confirm the specific screen, date, creative approval, licensed recording and final quote before payment or booking. A play log alone is not the video we promise. The demonstration is illustrative, not proof of a completed booking." },
  { question: "Can I keep a moment without going public?", answer: "Yes. Choose Keep it. Paid requests are not published in the free gallery. QR links are shareable access links, not identity-protected access; tell us before ordering if your film is confidential." },
  { question: "Do extra cards need another film or a typed key?", answer: "No. Same-memory cards share one film and design. Each card has its own QR link, with no typed key. Anyone with the link can watch. One card is included in each paid experience; extra cards, personalised designs and separate delivery addresses are agreed in the quote." },
] as const;

export function webpageSchema(path: string, name: string, description: string, type = "WebPage") {
  return { "@context": "https://schema.org", "@type": type, "@id": absoluteUrl(`${path}#webpage`),
    url: absoluteUrl(path), name, description, inLanguage: "en",
    isPartOf: { "@id": absoluteUrl("/#website") }, publisher: { "@id": absoluteUrl("/#organization") } };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, i) => ({
    "@type": "ListItem", position: i + 1, name: item.name, item: absoluteUrl(item.path),
  })) };
}

export function homeSchema() {
  const services = (["free", "keep", "nasdaq"] as const).map(offer => {
    const descriptions = {
      free: "Free self-service capture guide and a reviewed public moment page linking to your original social video. No video hosting, card or guaranteed social feature.",
      keep: "Creative direction, a curated 30–45 second film from customer footage, one revision and one physical UNIKMO memory card. Applicable tax and delivery are additional. Final scope and quote are confirmed before payment.",
      nasdaq: "Keep it plus a requested 15-second NASDAQ appearance in Times Square and licensed display footage in the memory film. Request only: screen, date, creative approval, licensed capture and final quote must be confirmed before payment or booking. Applicable tax and delivery are additional.",
    };
    return { "@type": "Service", "@id": absoluteUrl(`/#${offer}`), url: absoluteUrl(`/#${offer}`),
      name: offer === "nasdaq" ? "Go public — NASDAQ request" : POP_OFFERS[offer].name,
      serviceType: offer === "free" ? "Celebration sharing" : offer === "keep" ? "Celebration film curation" : "Times Square celebration request",
      description: descriptions[offer], provider: { "@id": absoluteUrl("/#organization") },
      brand: { "@id": "https://www.unikmo.com/#brand" },
      // Informational offer, not in-stock inventory or a guaranteed reservation.
      offers: { "@type": "Offer", url: absoluteUrl(`/#${offer}`), price: POP_OFFERS[offer].cents / 100,
        priceCurrency: "USD", description: descriptions[offer],
        priceSpecification: { "@type": "PriceSpecification", price: POP_OFFERS[offer].cents / 100, priceCurrency: "USD", valueAddedTaxIncluded: false } },
    };
  });
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": absoluteUrl("/#organization"), name: SITE_NAME, url: SITE_URL,
      description: SITE_DESCRIPTION, brand: { "@id": "https://www.unikmo.com/#brand" } },
    { "@type": "Brand", "@id": "https://www.unikmo.com/#brand", name: "UNIKMO", url: "https://www.unikmo.com/" },
    { "@type": "WebSite", "@id": absoluteUrl("/#website"), url: SITE_URL, name: SITE_NAME,
      alternateName: "The Pop Moment by UNIKMO", inLanguage: "en", publisher: { "@id": absoluteUrl("/#organization") } },
    webpageSchema("/", "Celebrate it. Show it. Keep it.", SITE_DESCRIPTION),
    ...services,
    { "@type": "FAQPage", "@id": absoluteUrl("/#questions"), url: absoluteUrl("/#questions"),
      mainEntity: POP_FAQS.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
  ] };
}
