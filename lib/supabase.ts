import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

let cachedClient: SupabaseClient<Database> | null | undefined;

export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  if (cachedClient !== undefined) return cachedClient;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
}
