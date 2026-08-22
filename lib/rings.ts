import { randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseDb } from "@/lib/firebase";

export type RingTier = "free" | "snapshot" | "video" | "takeover" | "vip";

export type Ring = {
  id: string;
  slug: string;
  startupName: string;
  website?: string | null;
  tagline?: string | null;
  category?: string | null;
  whatItDoes?: string | null;
  intendedCustomer?: string | null;
  founder?: string | null;
  problem?: string | null;
  story?: string | null;
  imageUrl?: string | null;
  socialUrl?: string | null;
  createdAt: string;
  tier: RingTier;
  status: string;
  indexable: boolean;
};

type RingDoc = {
  slug?: string | null;
  startupName: string;
  website?: string | null;
  tagline?: string | null;
  category?: string | null;
  whatItDoes?: string | null;
  intendedCustomer?: string | null;
  founder?: string | null;
  problem?: string | null;
  story?: string | null;
  imageUrl?: string | null;
  socialUrl?: string | null;
  createdAt: Timestamp | Date | string;
  tier?: RingTier;
  status?: string;
  indexable?: boolean;
};

export type CreateRingInput = {
  startupName: string;
  website?: string;
  tagline?: string;
  category?: string;
  whatItDoes?: string;
  intendedCustomer?: string;
  founder?: string;
  problem?: string;
  story?: string;
  imageUrl?: string;
  socialUrl?: string;
};

function toIso(value: RingDoc["createdAt"]) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function cleanText(value: string | undefined, max: number) {
  return value?.trim().replace(/\s+/g, " ").slice(0, max) || null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "startup";
}

function normalizeUrl(value: string | undefined, label: string) {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const explicitScheme = raw.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  if (explicitScheme && explicitScheme !== "http" && explicitScheme !== "https") {
    throw new Error(`${label} must use HTTP or HTTPS.`);
  }
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(candidate);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error(`${label} must use HTTP or HTTPS.`);
  if (!url.hostname) throw new Error(`${label} must be a valid URL.`);
  return url.toString();
}

export function isRingIndexable(ring: Pick<Ring, "website" | "socialUrl" | "category" | "whatItDoes" | "intendedCustomer" | "founder" | "problem" | "story" | "imageUrl">) {
  return Boolean(
    ring.website &&
    ring.socialUrl &&
    ring.category &&
    ring.whatItDoes &&
    ring.intendedCustomer &&
    ring.founder &&
    ring.problem &&
    ring.story &&
    ring.imageUrl,
  );
}

function toRing(id: string, doc: RingDoc): Ring {
  const slug = doc.slug || `${slugify(doc.startupName)}-${id.slice(0, 6)}`;
  const ring: Ring = {
    id,
    slug,
    startupName: doc.startupName,
    website: doc.website || null,
    tagline: doc.tagline || null,
    category: doc.category || null,
    whatItDoes: doc.whatItDoes || null,
    intendedCustomer: doc.intendedCustomer || null,
    founder: doc.founder || null,
    problem: doc.problem || null,
    story: doc.story || null,
    imageUrl: doc.imageUrl || null,
    socialUrl: doc.socialUrl || null,
    createdAt: toIso(doc.createdAt),
    tier: doc.tier || "free",
    status: doc.status || "rung",
    indexable: false,
  };
  ring.indexable = typeof doc.indexable === "boolean" ? doc.indexable : isRingIndexable(ring);
  return ring;
}

export async function listRings(limit = 12): Promise<Ring[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const snapshot = await db.collection("rings")
    .orderBy("createdAt", "desc")
    .limit(Math.min(limit, 200))
    .get();
  return snapshot.docs.map((doc) => toRing(doc.id, doc.data() as RingDoc));
}

export async function getRingBySlug(slugOrId: string): Promise<Ring | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const direct = await db.collection("rings").doc(slugOrId).get();
  if (direct.exists) return toRing(direct.id, direct.data() as RingDoc);

  const bySlug = await db.collection("rings").where("slug", "==", slugOrId).limit(1).get();
  if (!bySlug.empty) {
    const doc = bySlug.docs[0];
    return toRing(doc.id, doc.data() as RingDoc);
  }

  // Backward compatibility for Rings created before slugs were persisted.
  const recent = await db.collection("rings").orderBy("createdAt", "desc").limit(200).get();
  const match = recent.docs.find((doc) => toRing(doc.id, doc.data() as RingDoc).slug === slugOrId);
  return match ? toRing(match.id, match.data() as RingDoc) : null;
}

export async function createRing(input: CreateRingInput) {
  const startupName = input.startupName.trim().replace(/\s+/g, " ");
  if (startupName.length < 2 || startupName.length > 80) throw new Error("Startup name must be 2–80 characters.");

  const id = randomUUID();
  const slug = `${slugify(startupName)}-${id.slice(0, 6)}`;
  const createdAt = new Date();
  const website = normalizeUrl(input.website, "Website");
  const socialUrl = normalizeUrl(input.socialUrl, "Social link");
  const imageUrl = normalizeUrl(input.imageUrl, "Image URL");

  const ring: Ring = {
    id,
    slug,
    startupName,
    website,
    tagline: cleanText(input.tagline, 120),
    category: cleanText(input.category, 80),
    whatItDoes: cleanText(input.whatItDoes, 240),
    intendedCustomer: cleanText(input.intendedCustomer, 160),
    founder: cleanText(input.founder, 120),
    problem: cleanText(input.problem, 320),
    story: cleanText(input.story, 1000),
    imageUrl,
    socialUrl,
    createdAt: createdAt.toISOString(),
    tier: "free",
    status: "rung",
    indexable: false,
  };
  ring.indexable = isRingIndexable(ring);

  const db = getFirebaseDb();
  if (!db) return { ring, persisted: false };

  await db.collection("rings").doc(id).set({
    slug: ring.slug,
    startupName: ring.startupName,
    website: ring.website,
    tagline: ring.tagline,
    category: ring.category,
    whatItDoes: ring.whatItDoes,
    intendedCustomer: ring.intendedCustomer,
    founder: ring.founder,
    problem: ring.problem,
    story: ring.story,
    imageUrl: ring.imageUrl,
    socialUrl: ring.socialUrl,
    tier: ring.tier,
    status: ring.status,
    indexable: ring.indexable,
    createdAt: Timestamp.fromDate(createdAt),
  });

  return { ring, persisted: true };
}

export async function updateRingStatus(
  ringId: string | null | undefined,
  status: string,
  tier?: RingTier,
) {
  if (!ringId) return;
  const db = getFirebaseDb();
  if (!db) return;
  const patch: Record<string, unknown> = { status, updatedAt: Timestamp.now() };
  if (tier) patch.tier = tier;
  await db.collection("rings").doc(ringId).set(patch, { merge: true });
}
