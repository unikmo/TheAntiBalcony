export type FulfillmentStatus = "manual_review" | "ops_review" | "scheduled" | "live" | "proof_ready" | "failed";
export type CallbackFulfillmentStatus = Exclude<FulfillmentStatus, "manual_review">;
export type OperationsClearance = "pending" | "cleared" | "not_required";

export function assertFulfillmentTransition(input: {
  current: FulfillmentStatus;
  next: CallbackFulfillmentStatus;
  physicalCrew: boolean;
  operationsClearance: OperationsClearance;
}) {
  const { current, next, physicalCrew, operationsClearance } = input;

  if (current === next) return;
  if (current === "proof_ready") throw new Error("A proof-ready fulfillment job is already complete.");
  if (current === "failed") throw new Error("A failed fulfillment job must be reopened manually before it can advance.");
  if (next === "failed") return;

  if (physicalCrew) {
    if (current === "ops_review" && next === "scheduled") return;
    if (current === "scheduled" && next === "live") {
      if (operationsClearance !== "cleared") {
        throw new Error("Physical fulfillment cannot go live before operations clearance is cleared.");
      }
      return;
    }
    if (current === "live" && next === "proof_ready") return;
    throw new Error(`Invalid physical fulfillment transition: ${current} -> ${next}.`);
  }

  if (current === "manual_review" && next === "scheduled") return;
  if (current === "scheduled" && next === "live") return;
  if (current === "live" && next === "proof_ready") return;
  throw new Error(`Invalid digital fulfillment transition: ${current} -> ${next}.`);
}
