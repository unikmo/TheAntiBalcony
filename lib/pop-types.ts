import type { PopOffer } from "./pop-offers";
export type PopRequestRow = {
  id: string; submission_key: string; payload_hash: string; offer: PopOffer; title: string; email: string;
  occasion: string; celebration: string; moment_date: string; source_url: string | null;
  total_cards: number; subtotal_cents: number; public_consent: boolean; feature_consent: boolean;
  consent_version: string; consent_at: string; public_approved: boolean;
  status: "submitted" | "capture_pending" | "in_production" | "ready" | "cancelled";
  final_video_url: string | null; booking_ref: string | null; capture_license_ref: string | null;
  created_at: string; updated_at: string;
  review_log: Array<Record<string, string | boolean>>;
};
export type PopCardRow = { token: string; request_id: string; ordinal: number; enabled: boolean; created_at: string };
export type PublicPop = Pick<PopRequestRow, "id" | "title" | "occasion" | "moment_date" | "source_url">;
