// One contract for displayed prices and server-calculated requests. USD, before tax/delivery.
export const POP_OFFERS = {
  free: { name: "POP", cents: 0, action: "Share your POP", cardIncluded: false },
  keep: { name: "Keep it", cents: 19900, action: "Create your memory", cardIncluded: true },
  nasdaq: { name: "Go public", cents: 54900, action: "Request Times Square", cardIncluded: true },
} as const;
export type PopOffer = keyof typeof POP_OFFERS;
export const EXTRA_CARD_CENTS = 1200;
export const MAX_CARDS = 500;
export const OCCASIONS = ["Wedding", "Proposal", "Birthday", "Baby shower", "I love you", "Our memories", "Anniversary", "Graduation", "Launch", "Team win", "Company milestone", "Achievement", "Something else"] as const;
export const POP_CHOICES = ["Confetti", "Cork pop", "Streamers", "Balloons", "Team cheer", "My own POP"] as const;

export function isPopOffer(value: unknown): value is PopOffer {
  return typeof value === "string" && Object.hasOwn(POP_OFFERS, value);
}

export function quotePop(offer: PopOffer, totalCards: number) {
  if (!isPopOffer(offer)) throw new Error("Choose an available experience.");
  if (!Number.isInteger(totalCards) || (offer === "free" ? totalCards !== 0 : totalCards < 1 || totalCards > MAX_CARDS)) {
    throw new Error(offer === "free" ? "Free POP does not include cards." : `Choose 1–${MAX_CARDS} total cards.`);
  }
  const extraCards = Math.max(0, totalCards - 1);
  return { currency: "USD" as const, baseCents: POP_OFFERS[offer].cents, extraCards, extraCents: extraCards * EXTRA_CARD_CENTS,
    subtotalCents: POP_OFFERS[offer].cents + extraCards * EXTRA_CARD_CENTS, taxAndDeliveryIncluded: false as const };
}

export function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

const socialHosts = ["instagram.com", "youtube.com", "youtu.be", "linkedin.com", "vimeo.com", "tiktok.com", "facebook.com"];
export function validateSourceUrl(value: unknown, required = false) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new Error("Add the link to your public POP video.");
    return null;
  }
  if (typeof value !== "string" || value.length > 2000) throw new Error("Use a valid video link.");
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error("Use a full HTTPS video link."); }
  if (url.protocol !== "https:" || url.username || url.password || url.port || !url.hostname.includes(".") ||
      /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname) ||
      url.hostname.startsWith("[") || /\.(local|internal|test)$/.test(url.hostname)) {
    throw new Error("Use a public HTTPS video link, without credentials.");
  }
  if (required && !socialHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    throw new Error("For a free POP, use a public Instagram, YouTube, LinkedIn, Vimeo, TikTok or Facebook video link.");
  }
  return url.toString();
}

function text(value: unknown, label: string, max: number, min = 1) {
  if (typeof value !== "string") throw new Error(`${label} is required.`);
  const result = value.trim().replace(/\s+/g, " ");
  if (result.length < min || result.length > max) throw new Error(`${label} must be ${min}–${max} characters.`);
  return result;
}

export function validatePopSubmission(input: Record<string, unknown>) {
  if (!isPopOffer(input.offer)) throw new Error("Choose an available experience.");
  const offer = input.offer;
  const title = text(input.title, "Moment title", 100, 2);
  const email = text(input.email, "Email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  const occasion = text(input.occasion, "Occasion", 60);
  const celebration = text(input.celebration, "Your POP", 80);
  if (!OCCASIONS.some((v) => v === occasion) || !POP_CHOICES.some((v) => v === celebration)) throw new Error("Choose an occasion and POP style.");
  const momentDate = text(input.momentDate, "Occasion date", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(momentDate) || !Number.isFinite(Date.parse(momentDate)) || new Date(momentDate).toISOString().slice(0, 10) !== momentDate) throw new Error("Enter a valid occasion date.");
  const totalCards = input.totalCards;
  if (typeof totalCards !== "number") throw new Error("Enter the total number of cards.");
  const quote = quotePop(offer, totalCards);
  const sourceUrl = validateSourceUrl(input.sourceUrl, offer === "free");
  if (input.rightsAccepted !== true || input.privacyAcknowledged !== true) throw new Error("Confirm your footage permissions and privacy acknowledgement.");
  if (offer === "free" && input.publicConsent !== true) throw new Error("Confirm that your moment can appear on a public page.");
  if (offer === "nasdaq" && input.capturePendingAccepted !== true) throw new Error("Times Square is a request, subject to screen availability and licensed capture confirmation.");
  const submissionKey = text(input.submissionKey, "Submission reference", 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionKey)) throw new Error("Refresh the form and try again.");
  return { offer, title, email, occasion, celebration, momentDate, totalCards, sourceUrl, quote, submissionKey,
    publicConsent: offer === "free", featureConsent: input.featureConsent === true };
}
