import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyTableAccess } from "@/lib/security/table-guard"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await props.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured (running in mock client)" }, { status: 503 });
    }

    // 1. QR token + masa aktiflik dogrulamasi
    const access = await verifyTableAccess(supabase, tableId, token);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // Check if there is an active draft session
    let { data: session } = await supabase
      .from('order_sessions')
      .select('*')
      .eq('table_id', tableId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) {
      // Find highest tur_no first
      const { data: lastSession } = await supabase
        .from('order_sessions')
        .select('tur_no')
        .eq('table_id', tableId)
        .order('tur_no', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextTur = lastSession ? lastSession.tur_no + 1 : 1;

      // Create new draft session
      const { data: newSession, error: createErr } = await supabase
        .from('order_sessions')
        .insert({
          table_id: tableId,
          tur_no: nextTur,
          status: 'draft'
        })
        .select()
        .single();

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 500 });
      }
      session = newSession;
    }

    // Load cart items with product info
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('session_id', session.id);

    return NextResponse.json({ session, cartItems: cartItems || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
