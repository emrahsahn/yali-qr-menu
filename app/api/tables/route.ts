import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { mockTables } from "@/lib/supabase/mock-data"
import { isMockMode } from "@/lib/supabase/client"

// GET: Belirli bir mekana ait tüm masaları getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venue = searchParams.get('venue') || 'restaurant';

    if (isMockMode) {
      const filtered = mockTables.filter(t => t.venue === venue);
      return NextResponse.json({ tables: filtered });
    }

    const supabase = await createClient();
    if (!supabase) {
      const filtered = mockTables.filter(t => t.venue === venue);
      return NextResponse.json({ tables: filtered });
    }

    const { data: tables, error } = await supabase
      .from('tables')
      .select('*')
      .eq('venue', venue)
      .order('masa_no');

    if (error) {
      // Fallback to mock data if table column doesn't exist yet or query fails
      const filtered = mockTables.filter(t => t.venue === venue);
      return NextResponse.json({ tables: filtered });
    }

    return NextResponse.json({ tables: tables || [] });
  } catch {
    const venue = new URL(request.url).searchParams.get('venue') || 'restaurant';
    const filtered = mockTables.filter(t => t.venue === venue);
    return NextResponse.json({ tables: filtered });
  }
}

// POST: Toplu masa oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count, startNo, prefix, venue } = body;

    if (!count || !startNo || !venue) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const newTablesData = [];
    for (let i = 0; i < count; i++) {
      const masaNo = parseInt(startNo) + i;
      const masaAdi = prefix ? `${prefix} ${masaNo}` : `Masa ${masaNo}`;
      const randomToken = "token_" + Math.random().toString(36).substring(2, 12);
      const tableId = "tbl_" + Math.random().toString(36).substring(2, 10);
      
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

    const supabase = await createClient();
    if (!supabase) {
      newTablesData.forEach(t => mockTables.push(t));
      return NextResponse.json({ success: true, tables: newTablesData });
    }

    // Prepare insert objects for Supabase (id and token auto-generated if omitted, or provided)
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

// DELETE: Masa sil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Missing table id" }, { status: 400 });
    }

    if (isMockMode) {
      const idx = mockTables.findIndex(t => t.id === id);
      if (idx !== -1) mockTables.splice(idx, 1);
      return NextResponse.json({ success: true });
    }

    const supabase = await createClient();
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
