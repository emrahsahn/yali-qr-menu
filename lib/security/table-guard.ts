import type { SupabaseClient } from "@supabase/supabase-js"

export interface TableAccessResult {
  ok: boolean
  status: number
  error?: string
}

/**
 * QR token dogrulamasi + masa aktiflik kontrolu.
 * Tum masa oturumu/sepet/onay rotalarinda yetkilendirme icin zorunludur.
 */
export async function verifyTableAccess(
  supabase: SupabaseClient,
  tableId: string,
  token: string | null
): Promise<TableAccessResult> {
  if (!token || typeof token !== "string") {
    return { ok: false, status: 400, error: "Missing token" }
  }

  if (!tableId || typeof tableId !== "string") {
    return { ok: false, status: 400, error: "Invalid table id" }
  }

  const { data: table } = await supabase
    .from("tables")
    .select("id")
    .eq("id", tableId)
    .eq("qr_token", token)
    .eq("aktif", true)
    .maybeSingle()

  if (!table) {
    return { ok: false, status: 401, error: "Invalid table token" }
  }

  return { ok: true, status: 200 }
}

/**
 * Sepet adedi dogrulamasi: 1-99 arasi tam sayi.
 */
export function parseAdet(value: unknown): number | null {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1 || n > 99) return null
  return n
}

/**
 * Siparis notu sanitize: string zorunlulugu + uzunluk siniri.
 */
export function sanitizeNote(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 500)
}
