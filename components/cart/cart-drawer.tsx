"use client"

import React, { useState } from "react"
import { useTable } from "@/lib/context/table-context"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Plus, Minus, Lock, CheckCircle } from "lucide-react"

export function CartDrawer({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    cartItems,
    session,
    lang,
    t,
    updateCartItemAdet,
    confirmOrder
  } = useTable();

  const [isConfirming, setIsConfirming] = useState(false);

  if (!session) return null;

  const isLocked = session.status !== 'draft';

  // Calculate totals
  const totalItems = cartItems.reduce((acc, item) => acc + item.adet, 0);
  const totalPrice = cartItems.reduce((acc, item) => {
    const fiyat = Number(item.product?.fiyat || 0);
    return acc + (item.adet * fiyat);
  }, 0);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await confirmOrder();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-auto border-border bg-card text-foreground rounded-t-3xl shadow-2xl max-h-[88vh]">

        <DrawerHeader className="pb-3 border-b border-border">
          <DrawerTitle className="font-heading font-black text-xl text-foreground flex items-center justify-between">
            <span>{t('cart')}</span>
            <span className="text-xs font-black bg-primary/15 text-primary px-3 py-1 rounded-full border border-primary/30">
              {totalItems} {t('pieces')}
            </span>
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {t('cart')} listesi
          </DrawerDescription>
        </DrawerHeader>

        {/* Locked banner if session is not draft */}
        {isLocked && (
          <div className="mx-4 mt-3 p-3 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs rounded-2xl flex items-center gap-2">
            <Lock className="h-4 w-4 flex-shrink-0" />
            <span className="font-bold">
              {session.status === 'pending_approval' ? t('orderPending') : t('orderConfirmed')}
            </span>
          </div>
        )}

        {/* Scrollable list of items */}
        <ScrollArea className="flex-1 px-4 mt-3 overflow-y-auto max-h-[50vh] no-scrollbar">
          {cartItems.length === 0 ? (
            <div className="py-12 text-center text-foreground/50 text-sm font-semibold italic">
              {t('emptyCart')}
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-6">
              {cartItems.map((item) => {
                if (!item.product) return null;
                const productAd = lang === 'tr' ? item.product.ad_tr : item.product.ad_en;
                const productFiyat = Number(item.product.fiyat);
                
                return (
                  <div
                    key={item.id}
                    className="flex flex-col p-3.5 rounded-2xl bg-secondary/70 dark:bg-[#1F1913] border border-border gap-2.5 shadow-sm text-foreground"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col text-left">
                        <span className="font-heading font-black text-sm leading-tight text-foreground">
                          {productAd}
                        </span>
                        {item.not_text && (
                          <span className="text-xs text-foreground/70 italic mt-0.5 font-medium">
                            ✍️ {item.not_text}
                          </span>
                        )}
                      </div>
                      <span className="font-heading font-black text-sm text-primary whitespace-nowrap">
                        ₺{(productFiyat * item.adet).toFixed(2)}
                      </span>
                    </div>

                    {/* Increment/Decrement controls or Locked status */}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-foreground/60 font-bold">
                        ₺{productFiyat.toFixed(2)} / {t('pieces').toLowerCase()}
                      </span>

                      {isLocked ? (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>{t('confirmed')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-background dark:bg-[#282018] rounded-full p-1 border border-border shadow-inner">
                          {/* Minus */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateCartItemAdet(item.id, item.adet - 1)}
                            className="h-7 w-7 rounded-full text-foreground/70 hover:text-foreground hover:bg-secondary"
                          >
                            {item.adet <= 1 ? (
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            ) : (
                              <Minus className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <span className="w-6 text-center font-heading font-black text-xs text-foreground">
                            {item.adet}
                          </span>
                          {/* Plus */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateCartItemAdet(item.id, item.adet + 1)}
                            className="h-7 w-7 rounded-full text-foreground/70 hover:text-foreground hover:bg-secondary"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer info & CTA */}
        <DrawerFooter className="border-t border-border bg-card text-foreground p-4 rounded-b-3xl">
          <div className="flex flex-col gap-3">
            {/* Totals */}
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-foreground/60 font-black">
                {t('total')}
              </span>
              <span className="font-heading font-black text-2xl text-primary">
                ₺{totalPrice.toFixed(2)}
              </span>
            </div>

            {/* Confirm button - HIGH CONTRAST */}
            {!isLocked && (
              <Button
                onClick={handleConfirm}
                disabled={isConfirming || cartItems.length === 0}
                className="w-full py-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-heading font-black text-base transition-all duration-300 shadow-lg shadow-primary/25 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isConfirming ? "..." : t('confirmOrder')}
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full py-5 rounded-2xl border-border text-foreground hover:bg-secondary font-heading font-bold text-sm cursor-pointer"
            >
              {t('cancel')}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
