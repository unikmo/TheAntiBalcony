import { randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseDb } from "@/lib/firebase";

export type Ring = {
  id: string;
  startupName: string;
  website?: string | null;
  tagline?: string | null;
  createdAt: string;
  tier: "free" | "snapshot" | "video" | "live";
  status: string;
};

type RingDoc = {
  startupName: string;
  website: string | null;
  tagline: string | null;
  createdAt: Timestamp | Date | string;
  tier: Ring["tier"];
  status: string;
};

function toIso(value: RingDoc["createdAt"]) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function toRing(id: string, doc: RingDoc): Ring {
  return {
    id,
    startupName: doc.startupName,
    website: doc.website,
    tagline: doc.tagline,
    createdAt: toIso(doc.createdAt),
    tier: doc.tier || "free",
    status: doc.status || "rung",
  };
}

function normalizeWebsite(value?: string) {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(candidate);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Website must use HTTP or HTTPS.");
  return url.toString();
}

export async function listRings(limit = 12): Promise<Ring[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const snapshot = await db.collection("rings")
    .orderBy("createdAt", "desc")
    .limit(Math.min(limit, 50))
    .get();
  return snapshot.docs.map((doc) => toRing(doc.id, doc.data() as RingDoc));
}

export async function createRing(input: { startupName: string; website?: string; tagline?: string }) {
  const startupName = input.startupName.trim().replace(/\s+/g, " ");
  if (startupName.length < 2 || startupName.length > 80) throw new Error("Startup name must be 2–80 characters.");
  const tagline = input.tagline?.trim().replace(/\s+/g, " ").slice(0, 120) || null;
  const website = normalizeWebsite(input.website);
  const id = randomUUID();
  const createdAt = new Date();
  const fallback: Ring = {
    id,
    startupName,
    website,
    tagline,
    createdAt: createdAt.toISOString(),
    tier: "free",
    status: "rung",
  };

  const db = getFirebaseDb();
  if (!db) return { ring: fallback, persisted: false };

  await db.collection("rings").doc(id).set({
    startupName,
    website,
    tagline,
    tier: "free",
    status: "rung",
    createdAt: Timestamp.fromDate(createdAt),
  });

  return { ring: fallback, persisted: true };
}

export async function updateRingStatus(
  ringId: string | null | undefined,
  status: string,
  tier?: Ring["tier"],
) {
  if (!ringId) return;
  const db = getFirebaseDb();
  if (!db) return;
  const patch: Record<string, unknown> = { status, updatedAt: Timestamp.now() };
  if (tier) patch.tier = tier;
  await db.collection("rings").doc(ringId).set(patch, { merge: true });
}
