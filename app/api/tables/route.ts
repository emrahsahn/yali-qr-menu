import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { mockTables } from "@/lib/supabase/mock-data"
import { isMockMode } from "@/lib/supabase/client"
import { verifyStaffSession } from "@/lib/security/auth-guard"
import { Table } from "@/lib/types/database"

const PUBLIC_TABLE_COLUMNS = "id, masa_no, masa_adi, venue, aktif, created_at"
const KNOWN_VENUES = new Set(["restaurant", "cafe", "club", "seafood"])

// qr_token masa erisiminin tek gizli anahtari oldugu icin yalnizca
// gorevli oturumu olan istemcilere aciklanir.
function stripTokens(tables: Table[]): Omit<Table, "qr_token">[] {
  return tables.map(({ qr_token: _qrToken, ...rest }) => rest)
}

// GET: Belirli bir mekana ait tüm masaları getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venue = searchParams.get('venue') || 'restaurant';
    const auth = verifyStaffSession(request);
    const includeToken = auth.authenticated;

    if (isMockMode) {
      const filtered = mockTables.filter(t => t.venue === venue);
      const safeTables = includeToken ? filtered : stripTokens(filtered);
      return NextResponse.json({ tables: safeTables });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      const filtered = mockTables.filter(t => t.venue === venue);
      const safeTables = includeToken ? filtered : stripTokens(filtered);
      return NextResponse.json({ tables: safeTables });
    }

    const { data: tables, error } = await supabase
      .from('tables')
      .select(includeToken ? '*' : PUBLIC_TABLE_COLUMNS)
      .eq('venue', venue)
      .order('masa_no');

    if (error) {
      // Fallback to mock data if table column doesn't exist yet or query fails
      const filtered = mockTables.filter(t => t.venue === venue);
      const safeTables = includeToken ? filtered : stripTokens(filtered);
      return NextResponse.json({ tables: safeTables });
    }

    return NextResponse.json({ tables: tables || [] });
  } catch {
    const venue = new URL(request.url).searchParams.get('venue') || 'restaurant';
    const filtered = mockTables.filter(t => t.venue === venue);
    return NextResponse.json({ tables: stripTokens(filtered) });
  }
}

// POST: Toplu masa oluştur (SADECE GÖREVLİ / AUTH GEREKLİDİR)
export async function POST(request: NextRequest) {
  try {
    const auth = verifyStaffSession(request)
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: "Yetkisiz işlem. Masa oluşturmak için lütfen görevli girişi yapınız." },
        { status: 401 }
      )
    }

    const body = await request.json();
    const { count, startNo, prefix, venue } = body;

    const parsedCount = Number(count)
    const parsedStartNo = Number(startNo)
    if (!Number.isInteger(parsedCount) || parsedCount < 1 || parsedCount > 500) {
      return NextResponse.json({ error: "count 1-500 arası bir tam sayı olmalıdır." }, { status: 400 })
    }
    if (!Number.isInteger(parsedStartNo) || parsedStartNo < 1 || parsedStartNo > 9999) {
      return NextResponse.json({ error: "startNo 1-9999 arası bir tam sayı olmalıdır." }, { status: 400 })
    }
    if (typeof venue !== "string" || !KNOWN_VENUES.has(venue)) {
      return NextResponse.json({ error: "Geçersiz mekân (venue)." }, { status: 400 })
    }

    const cleanPrefix = typeof prefix === "string" ? prefix.trim().slice(0, 40) : ""

    const newTablesData = [];
    for (let i = 0; i < parsedCount; i++) {
      const masaNo = parsedStartNo + i;
      const masaAdi = cleanPrefix ? `${cleanPrefix} ${masaNo}` : `Masa ${masaNo}`;
      // Kriptografik rastgelelik: Math.random tahmin edilebilir oldugu icin kullanilmaz.
      const randomToken = "tok_" + crypto.randomBytes(16).toString("hex");
      const tableId = "tbl_" + crypto.randomBytes(8).toString("hex");

      newTablesData.push({
        id: tableId,
        masa_no: masaNo,
        masa_adi: masaAdi,
        venue: venue,
        qr_token: randomToken,
        aktif: true,
        created_at: new Date().toISOString()
      });
    }

    if (isMockMode) {
      newTablesData.forEach(t => mockTables.push(t));
      return NextResponse.json({ success: true, tables: newTablesData });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      newTablesData.forEach(t => mockTables.push(t));
      return NextResponse.json({ success: true, tables: newTablesData });
    }

    const dbInserts = newTablesData.map(t => ({
      id: t.id,
      masa_no: t.masa_no,
      masa_adi: t.masa_adi,
      venue: t.venue,
      qr_token: t.qr_token,
      aktif: true
    }));

    const { data, error } = await supabase
      .from('tables')
      .insert(dbInserts)
      .select();

    if (error) {
      // Fallback to mock memory storage if DB insertion fails
      newTablesData.forEach(t => mockTables.push(t));
      return NextResponse.json({ success: true, tables: newTablesData });
    }

    return NextResponse.json({ success: true, tables: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Masa sil (SADECE GÖREVLİ / AUTH GEREKLİDİR)
export async function DELETE(request: NextRequest) {
  try {
    const auth = verifyStaffSession(request)
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: "Yetkisiz işlem. Masa silmek için lütfen görevli girişi yapınız." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing table id" }, { status: 400 });
    }

    if (isMockMode) {
      const idx = mockTables.findIndex(t => t.id === id);
      if (idx !== -1) mockTables.splice(idx, 1);
      return NextResponse.json({ success: true });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      const idx = mockTables.findIndex(t => t.id === id);
      if (idx !== -1) mockTables.splice(idx, 1);
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id);

    if (error) {
      const idx = mockTables.findIndex(t => t.id === id);
      if (idx !== -1) mockTables.splice(idx, 1);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
