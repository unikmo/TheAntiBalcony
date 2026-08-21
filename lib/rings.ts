import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

export type Ring = {
  id: string;
  startupName: string;
  website?: string | null;
  tagline?: string | null;
  createdAt: string;
  tier: "free" | "paid";
  status: string;
};

type RingRow = {
  id: string;
  startup_name: string;
  website: string | null;
  tagline: string | null;
  created_at: string;
  tier: "free" | "paid";
  status: string;
};

function toRing(row: RingRow): Ring {
  return {
    id: row.id,
    startupName: row.startup_name,
    website: row.website,
    tagline: row.tagline,
    createdAt: row.created_at,
    tier: row.tier,
    status: row.status,
  };
}

function normalizeWebsite(value?: string) {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(candidate);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Website must use HTTP or HTTPS.");
  return url.toString();
}

export async function listRings(limit = 12): Promise<Ring[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("rings")
    .select("id,startup_name,website,tagline,created_at,tier,status")
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 50));
  if (error) throw error;
  return ((data ?? []) as RingRow[]).map(toRing);
}

export async function createRing(input: { startupName: string; website?: string; tagline?: string }) {
  const startupName = input.startupName.trim().replace(/\s+/g, " ");
  if (startupName.length < 2 || startupName.length > 80) throw new Error("Startup name must be 2–80 characters.");
  const tagline = input.tagline?.trim().replace(/\s+/g, " ").slice(0, 120) || null;
  const website = normalizeWebsite(input.website);
  const fallback: Ring = {
    id: randomUUID(),
    startupName,
    website,
    tagline,
    createdAt: new Date().toISOString(),
    tier: "free",
    status: "rung",
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { ring: fallback, persisted: false };
  const { data, error } = await supabase
    .from("rings")
    .insert({ startup_name: startupName, website, tagline, tier: "free", status: "rung" })
    .select("id,startup_name,website,tagline,created_at,tier,status")
    .single();
  if (error) throw error;
  return { ring: toRing(data as RingRow), persisted: true };
}

export async function updateRingStatus(ringId: string | null | undefined, status: string, tier?: "free" | "paid") {
  if (!ringId) return;
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const patch: Record<string, string> = { status };
  if (tier) patch.tier = tier;
  await supabase.from("rings").update(patch).eq("id", ringId);
}
