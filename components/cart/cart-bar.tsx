"use client"

import React from "react"
import { useTable } from "@/lib/context/table-context"
import { ShoppingBag } from "lucide-react"

export function CartBar({
  onOpenCart
}: {
  onOpenCart: () => void;
}) {
  const { cartItems, session, t } = useTable();

  // If session is closed or not available, or cart is empty
  if (!session || cartItems.length === 0) return null;

  // Calculate totals
  const totalItems = cartItems.reduce((acc, item) => acc + item.adet, 0);
  const totalPrice = cartItems.reduce((acc, item) => {
    const fiyat = Number(item.product?.fiyat || 0);
    return acc + (item.adet * fiyat);
  }, 0);

  // If order is already submitted for approval, the drawer should still be viewable
  // but it's locked. We still want to show the cart bar.

  return (
    <div className="fixed bottom-5 sm:bottom-6 left-3 sm:left-4 right-3 sm:right-4 z-40 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto animate-in slide-in-from-bottom-12 duration-300">
      <button
        onClick={onOpenCart}
        className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-3xl bg-primary text-white shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.01] active:scale-98 relative overflow-hidden cursor-pointer"
      >
        {/* Shine animation overlay */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

        <div className="flex items-center gap-3">
          <div className="relative bg-white/20 p-2.5 rounded-2xl">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-white text-primary font-heading font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-primary animate-pulse">
              {totalItems}
            </span>
          </div>
          <div className="flex flex-col items-start">
            <span className="font-heading font-extrabold text-sm uppercase tracking-wide opacity-90">
              {t('cart')}
            </span>
            <span className="text-[10px] opacity-75">
              {totalItems} {t('pieces')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-heading font-black text-lg">
          <span>₺{totalPrice.toFixed(2)}</span>
          <span className="text-white/70">→</span>
        </div>
      </button>
    </div>
  );
}
