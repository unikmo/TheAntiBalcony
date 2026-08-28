export const ORDER_STATUSES = [
  "creative_upload_pending",
  "availability_check",
  "creative_review",
  "needs_changes",
  "payment_pending",
  "booked",
  "scheduled",
  "played",
  "capture_required",
  "capture_processing",
  "capture_ready",
  "packaging_required",
  "packaging",
  "proof_ready",
  "delivered",
  "cancelled",
  "failed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = "not_requested" | "pending" | "manual_paid" | "waived" | "refunded";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  creative_upload_pending: ["availability_check", "cancelled", "failed"],
  availability_check: ["creative_review", "needs_changes", "payment_pending", "cancelled", "failed"],
  creative_review: ["needs_changes", "payment_pending", "cancelled", "failed"],
  needs_changes: ["creative_upload_pending", "creative_review", "cancelled", "failed"],
  payment_pending: ["booked", "cancelled", "failed"],
  booked: ["scheduled", "cancelled", "failed"],
  scheduled: ["played", "cancelled", "failed"],
  played: ["capture_required", "capture_processing", "failed"],
  capture_required: ["capture_processing", "capture_ready", "failed"],
  capture_processing: ["capture_ready", "failed"],
  capture_ready: ["packaging_required", "packaging", "proof_ready", "failed"],
  packaging_required: ["packaging", "proof_ready", "failed"],
  packaging: ["proof_ready", "failed"],
  proof_ready: ["delivered", "failed"],
  delivered: [],
  cancelled: [],
  failed: [],
};

export function assertOrderTransition(input: {
  current: OrderStatus;
  next: OrderStatus;
  paymentStatus: PaymentStatus;
}) {
  if (input.current === input.next) return;
  if (!TRANSITIONS[input.current].includes(input.next)) {
    throw new Error(`Invalid order transition: ${input.current} -> ${input.next}.`);
  }
  if (input.next === "booked" && !["manual_paid", "waived"].includes(input.paymentStatus)) {
    throw new Error("A Blindspot booking cannot be confirmed before manual payment or an approved waiver.");
  }
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus);
}

export function statusLabel(status: OrderStatus) {
  return status.replaceAll("_", " ");
}
