import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Sunucu-tarı service role istemcisi. RLS'i atlar — SADECE sunucu tarafında
 * (API rotaları, sunucu bileşenleri) kullanılmalı; asla client bundle'a girmemelidir.
 * SUPABASE_SERVICE_ROLE_KEY tarayıcıya açılmayan (NEXT_PUBLIC öneksiz) bir secret'tır.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || url === "your-supabase-url") {
    return null;
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
