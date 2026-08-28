export type DisplayWindowCode = "08-12" | "12-16" | "16-20" | "20-24";
export type MomentTier = "snapshot" | "video" | "takeover";

export const DISPLAY_WINDOWS: Record<DisplayWindowCode, { startHour: number; endHour: number; label: string }> = {
  "08-12": { startHour: 8, endHour: 12, label: "8 AM–12 PM" },
  "12-16": { startHour: 12, endHour: 16, label: "12 PM–4 PM" },
  "16-20": { startHour: 16, endHour: 20, label: "4 PM–8 PM" },
  "20-24": { startHour: 20, endHour: 24, label: "8 PM–12 AM" },
};

export type BlindspotAvailabilityRequest = {
  orderId: string;
  orderRef: string;
  occasion: string;
  tier: MomentTier;
  eventDate: string;
  preferredWindow: DisplayWindowCode;
  backupWindow?: DisplayWindowCode | null;
  anyTimeSameDay: boolean;
  timezone: "America/New_York";
  board: "times_square_flexible" | "nasdaq_tower";
};

export type BlindspotAvailabilityResult = {
  status: "available" | "unavailable" | "manual_review";
  providerRef?: string | null;
  holdRef?: string | null;
  holdExpiresAt?: string | null;
  resolvedWindow?: DisplayWindowCode | "any" | null;
  resolvedWindowStart?: string | null;
  resolvedWindowEnd?: string | null;
  quote?: Record<string, unknown>;
};

export type BlindspotConfirmationResult = {
  status: "confirmed" | "manual_review" | "failed";
  providerRef?: string | null;
  campaignId?: string | null;
  scheduledWindowStart?: string | null;
  scheduledWindowEnd?: string | null;
};

function bridgeUrl() {
  return process.env.BLINDSPOT_BOOKING_BRIDGE_URL || process.env.BLINDSPOT_API_BRIDGE_URL;
}

function headers(idempotencyKey: string) {
  return {
    "Content-Type": "application/json",
    "Idempotency-Key": idempotencyKey,
    ...(process.env.BLINDSPOT_BOOKING_BRIDGE_SECRET
      ? { Authorization: `Bearer ${process.env.BLINDSPOT_BOOKING_BRIDGE_SECRET}` }
      : {}),
  };
}

export async function checkBlindspotAvailability(
  input: BlindspotAvailabilityRequest,
): Promise<BlindspotAvailabilityResult> {
  const url = bridgeUrl();
  if (!url) return { status: "manual_review" };

  const response = await fetch(url, {
    method: "POST",
    headers: headers(`${input.orderId}:availability`),
    body: JSON.stringify({
      source: "the-anti-balcony",
      event: "availability_hold_requested",
      promise: {
        guaranteedDate: input.eventDate,
        exactPlaybackMinuteGuaranteed: false,
        requestedWindowHours: 4,
        preferredWindow: input.preferredWindow,
        backupWindow: input.backupWindow || null,
        anyTimeSameDay: input.anyTimeSameDay,
        screenGuarantee: input.board === "nasdaq_tower" ? "nasdaq_tower" : "times_square_flexible",
      },
      ...input,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/orders/provider-callback`,
    }),
  });

  if (!response.ok) throw new Error(`Blindspot availability bridge returned ${response.status}.`);
  const data = (await response.json().catch(() => ({}))) as BlindspotAvailabilityResult;
  if (!data.status || !["available", "unavailable", "manual_review"].includes(data.status)) {
    return { status: "manual_review" };
  }
  return data;
}

export async function confirmBlindspotBooking(input: {
  orderId: string;
  orderRef: string;
  holdRef?: string | null;
  providerRef?: string | null;
  stripeSessionId: string;
}): Promise<BlindspotConfirmationResult> {
  const url = bridgeUrl();
  if (!url) return { status: "manual_review" };

  const response = await fetch(url, {
    method: "POST",
    headers: headers(`${input.orderId}:confirm`),
    body: JSON.stringify({
      source: "the-anti-balcony",
      event: "confirm_booking",
      ...input,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/orders/provider-callback`,
    }),
  });

  if (!response.ok) throw new Error(`Blindspot confirmation bridge returned ${response.status}.`);
  const data = (await response.json().catch(() => ({}))) as BlindspotConfirmationResult;
  if (!data.status || !["confirmed", "manual_review", "failed"].includes(data.status)) {
    return { status: "manual_review" };
  }
  return data;
}
