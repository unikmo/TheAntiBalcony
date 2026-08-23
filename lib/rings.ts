import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

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

type RingRow = {
  id: string;
  slug: string;
  startup_name: string;
  website: string | null;
  tagline: string | null;
  category: string | null;
  what_it_does: string | null;
  intended_customer: string | null;
  founder: string | null;
  problem: string | null;
  story: string | null;
  image_url: string | null;
  social_url: string | null;
  created_at: string;
  tier: RingTier;
  status: string;
  indexable: boolean;
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

function toRing(row: RingRow): Ring {
  return {
    id: row.id,
    slug: row.slug,
    startupName: row.startup_name,
    website: row.website,
    tagline: row.tagline,
    category: row.category,
    whatItDoes: row.what_it_does,
    intendedCustomer: row.intended_customer,
    founder: row.founder,
    problem: row.problem,
    story: row.story,
    imageUrl: row.image_url,
    socialUrl: row.social_url,
    createdAt: new Date(row.created_at).toISOString(),
    tier: row.tier || "free",
    status: row.status || "rung",
    indexable: Boolean(row.indexable),
  };
}

export async function listRings(limit = 12): Promise<Ring[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const { data, error } = await db
    .from("anti_balcony_rings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 200));

  if (error) throw new Error(`Could not load Rings: ${error.message}`);
  return (data as RingRow[]).map(toRing);
}

export async function getRingBySlug(slugOrId: string): Promise<Ring | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(slugOrId)) {
    const { data, error } = await db
      .from("anti_balcony_rings")
      .select("*")
      .eq("id", slugOrId)
      .maybeSingle();
    if (error) throw new Error(`Could not load Ring: ${error.message}`);
    if (data) return toRing(data as RingRow);
  }

  const { data, error } = await db
    .from("anti_balcony_rings")
    .select("*")
    .eq("slug", slugOrId)
    .maybeSingle();

  if (error) throw new Error(`Could not load Ring: ${error.message}`);
  return data ? toRing(data as RingRow) : null;
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

  const db = getSupabaseAdmin();
  if (!db) return { ring, persisted: false };

  const { error } = await db.from("anti_balcony_rings").insert({
    id: ring.id,
    slug: ring.slug,
    startup_name: ring.startupName,
    website: ring.website,
    tagline: ring.tagline,
    category: ring.category,
    what_it_does: ring.whatItDoes,
    intended_customer: ring.intendedCustomer,
    founder: ring.founder,
    problem: ring.problem,
    story: ring.story,
    image_url: ring.imageUrl,
    social_url: ring.socialUrl,
    tier: ring.tier,
    status: ring.status,
    indexable: ring.indexable,
    created_at: ring.createdAt,
    updated_at: ring.createdAt,
  });

  if (error) throw new Error(`Could not save Ring: ${error.message}`);
  return { ring, persisted: true };
}

export async function updateRingStatus(
  ringId: string | null | undefined,
  status: string,
  tier?: RingTier,
) {
  if (!ringId) return;
  const db = getSupabaseAdmin();
  if (!db) return;

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (tier) patch.tier = tier;

  const { error } = await db.from("anti_balcony_rings").update(patch).eq("id", ringId);
  if (error) throw new Error(`Could not update Ring status: ${error.message}`);
}
