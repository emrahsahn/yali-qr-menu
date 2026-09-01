import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await props.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured (running in mock client)" }, { status: 503 });
    }

    // Configure client headers for token RLS
    // In server-side client, we can query tables first or call RPC
    // Let's verify table token
    const { data: table, error: tableErr } = await supabase
      .from('tables')
      .select('id, masa_no')
      .eq('id', tableId)
      .eq('qr_token', token)
      .single();

    if (tableErr || !table) {
      return NextResponse.json({ error: "Invalid table token" }, { status: 401 });
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
