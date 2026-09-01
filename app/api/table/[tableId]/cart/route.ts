import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    if (!token || !productId || !adet) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not configured" }, { status: 503 });
    }

    // Get active draft session
    const { data: session } = await supabase
      .from('order_sessions')
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
      .eq('not_text', notText || null)
      .maybeSingle();

    if (existingItem) {
      const { error: updateErr } = await supabase
        .from('cart_items')
        .update({ adet: existingItem.adet + adet })
        .eq('id', existingItem.id);

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    } else {
      const { error: insertErr } = await supabase
        .from('cart_items')
        .insert({
          session_id: session.id,
          product_id: productId,
          adet,
          not_text: notText || null
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
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const { itemId, adet } = await request.json();

    if (!token || !itemId || adet === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Supabase offline" }, { status: 503 });

    // Update quantity
    const { error: updateErr } = await supabase
      .from('cart_items')
      .update({ adet })
      .eq('id', itemId);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Get session to reload cart items
    const { data: cartItem } = await supabase
      .from('cart_items')
      .select('session_id')
      .eq('id', itemId)
      .single();

    let cartItems = [];
    if (cartItem) {
      const { data: items } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('session_id', cartItem.session_id);
      if (items) cartItems = items;
    }

    return NextResponse.json({ success: true, cartItems });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const { itemId } = await request.json();

    if (!token || !itemId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Supabase offline" }, { status: 503 });

    // Get session_id before deletion so we can fetch updated cart
    const { data: cartItem } = await supabase
      .from('cart_items')
      .select('session_id')
      .eq('id', itemId)
      .single();

    if (!cartItem) {
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
      .eq('session_id', cartItem.session_id);

    return NextResponse.json({ success: true, cartItems: cartItems || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
