import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyTableAccess } from "@/lib/security/table-guard"

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await props.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase offline" }, { status: 503 });
    }

    // 1. QR token + masa aktiflik dogrulamasi
    const access = await verifyTableAccess(supabase, tableId, token);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // Find current active draft session
    const { data: session } = await supabase
      .from('order_sessions')
      .select('*')
      .eq('table_id', tableId)
      .eq('status', 'draft')
      .single();

    if (!session) {
      // If it's already pending_approval, we can return success (idempotent)
      const { data: pendingSession } = await supabase
        .from('order_sessions')
        .select('*')
        .eq('table_id', tableId)
        .eq('status', 'pending_approval')
        .maybeSingle();

      if (pendingSession) {
        return NextResponse.json({ success: true, session: pendingSession });
      }

      return NextResponse.json({ error: "No active draft session to confirm" }, { status: 404 });
    }

    // Update status to pending_approval
    const { data: updatedSession, error: updateErr } = await supabase
      .from('order_sessions')
      .update({ status: 'pending_approval' })
      .eq('id', session.id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
