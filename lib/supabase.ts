import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type UntypedSupabaseClient = SupabaseClient<any, "public", any>;

let cachedClient: UntypedSupabaseClient | null | undefined;

export function getSupabaseAdmin(): UntypedSupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient<any>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as UntypedSupabaseClient;

  return cachedClient;
}
