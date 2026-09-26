import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyTableAccess, parseAdet, sanitizeNote } from "@/lib/security/table-guard"

// POST: Add item to cart
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await props.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const { productId, adet, notText } = await request.json();

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not configured" }, { status: 503 });
    }

    // 1. QR token dogrulamasi (masa sahipligi)
    const access = await verifyTableAccess(supabase, tableId, token);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // 2. Girdi dogrulamasi
    const parsedAdet = parseAdet(adet);
    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "Missing or invalid productId" }, { status: 400 });
    }
    if (parsedAdet === null) {
      return NextResponse.json({ error: "adet must be an integer between 1 and 99" }, { status: 400 });
    }

    // 3. Urun gercekten var ve aktif mi?
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("aktif", true)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: "Product not found or inactive" }, { status: 404 });
    }

    const not = sanitizeNote(notText);

    // 4. Masanin aktif draft oturumunu bul
    const { data: session } = await supabase
      .from("order_sessions")
      .select('id, status')
      .eq('table_id', tableId)
      .eq('status', 'draft')
      .single();

    if (!session) {
      return NextResponse.json({ error: "No active draft session found" }, { status: 404 });
    }

    // Check if item exists with same session, product, and note
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, adet')
      .eq('session_id', session.id)
      .eq('product_id', productId)
      .eq('not_text', not)
      .maybeSingle();

    if (existingItem) {
      const yeniAdet = Math.min(existingItem.adet + parsedAdet, 99);
      const { error: updateErr } = await supabase
        .from('cart_items')
        .update({ adet: yeniAdet })
        .eq('id', existingItem.id);

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    } else {
      const { error: insertErr } = await supabase
        .from('cart_items')
        .insert({
          session_id: session.id,
          product_id: productId,
          adet: parsedAdet,
          not_text: not
        });

      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Return updated cart items list
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('session_id', session.id);

    return NextResponse.json({ success: true, cartItems: cartItems || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: Update quantity of a cart item
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await props.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const { itemId, adet } = await request.json();

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "Supabase offline" }, { status: 503 });

    // 1. QR token dogrulamasi (masa sahipligi)
    const access = await verifyTableAccess(supabase, tableId, token);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const parsedAdet = parseAdet(adet);
    if (!itemId || typeof itemId !== "string") {
      return NextResponse.json({ error: "Missing or invalid itemId" }, { status: 400 });
    }
    if (parsedAdet === null) {
      return NextResponse.json({ error: "adet must be an integer between 1 and 99" }, { status: 400 });
    }

    // 2. Kalem bu masanin draft oturumuna mi ait? (IDOR korumasi)
    const { data: cartItem } = await supabase
      .from('cart_items')
      .select('id, session_id')
      .eq('id', itemId)
      .single();

    if (!cartItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const { data: session } = await supabase
      .from('order_sessions')
      .select('id, table_id, status')
      .eq('id', cartItem.session_id)
      .single();

    if (!session || session.table_id !== tableId || session.status !== 'draft') {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Update quantity
    const { error: updateErr } = await supabase
      .from('cart_items')
      .update({ adet: parsedAdet })
      .eq('id', itemId);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    const { data: items } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('session_id', session.id);

    return NextResponse.json({ success: true, cartItems: items || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Remove item from cart
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await props.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const { itemId } = await request.json();

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "Supabase offline" }, { status: 503 });

    // 1. QR token dogrulamasi (masa sahipligi)
    const access = await verifyTableAccess(supabase, tableId, token);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    if (!itemId || typeof itemId !== "string") {
      return NextResponse.json({ error: "Missing or invalid itemId" }, { status: 400 });
    }

    // 2. Kalem bu masanin draft oturumuna mi ait? (IDOR korumasi)
    const { data: cartItem } = await supabase
      .from('cart_items')
      .select('id, session_id')
      .eq('id', itemId)
      .single();

    if (!cartItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const { data: session } = await supabase
      .from('order_sessions')
      .select('id, table_id, status')
      .eq('id', cartItem.session_id)
      .single();

    if (!session || session.table_id !== tableId || session.status !== 'draft') {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const { error: deleteErr } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

    // Load remaining cart items
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('session_id', session.id);

    return NextResponse.json({ success: true, cartItems: cartItems || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
