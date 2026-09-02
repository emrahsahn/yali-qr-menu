"use client"

import React from "react"
import { Product } from "@/lib/types/database"
import { useTable } from "@/lib/context/table-context"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X, Layers } from "lucide-react"

export function ProductDetailDialog({
  product,
  isOpen,
  onClose
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { lang, t } = useTable();

  if (!product) return null;

  const ad = lang === 'tr' ? product.ad_tr : product.ad_en;
  const aciklama = lang === 'tr' ? product.aciklama_tr : product.aciklama_en;
  
  const allergens = product.ozellikler?.alerjenler || [];
  const hasAllergens = allergens.length > 0;

  const isVegetarian = !!product.ozellikler?.vejetaryen;
  const isVegan = !!product.ozellikler?.vegan;
  const isSpicy = !!product.ozellikler?.acili;
  const isCold = !!product.ozellikler?.soğuk || !!product.ozellikler?.soguk;
  const hasCaffeine = !!product.ozellikler?.kafein;
  const isChefSpecial = !!product.ozellikler?.sef_onerisi;
  const prepTime = product.ozellikler?.hazirlama_suresi;

  const hasAnyBadges = isVegetarian || isVegan || isSpicy || isCold || hasCaffeine || isChefSpecial || !!prepTime;

  const portions = product.porsiyonlar || [];
  const hasPortions = portions.length > 0;

  const minPortionPrice = hasPortions
    ? Math.min(...portions.map(p => Number(p.fiyat) || 0))
    : Number(product.fiyat);

  const maxPortionPrice = hasPortions
    ? Math.max(...portions.map(p => Number(p.fiyat) || 0))
    : Number(product.fiyat);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[94vw] max-w-lg sm:max-w-xl p-0 overflow-hidden border-border bg-card text-foreground rounded-3xl shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{ad}</DialogTitle>
        </DialogHeader>

        {/* Product Image */}
        <div className="relative aspect-[16/10] w-full bg-muted">
          <Image
            src={product.gorsel_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60"}
            alt={ad}
            fill
            unoptimized
            className="object-cover"
          />
          {/* Close Floating Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer border border-white/20 shadow-lg"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Subtle top shading overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-wide text-shadow-md">
              {ad}
            </h2>
          </div>
        </div>

        {/* Details Container */}
        <div className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto max-h-[50vh] no-scrollbar">
          {/* Description */}
          {aciklama && (
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium">
              {aciklama}
            </p>
          )}

          {/* Static Portion / Size / Volume Pricing List */}
          {hasPortions && (
            <div className="flex flex-col gap-2 pt-1 pb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-foreground/70 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>{lang === 'tr' ? 'Porsiyon & Boyut Seçenekleri' : 'Portion & Size Options'}</span>
              </span>

              <div className="flex flex-col gap-1.5">
                {portions.map((portion) => {
                  const portionName = lang === 'tr' ? portion.ad_tr : (portion.ad_en || portion.ad_tr);

                  return (
                    <div
                      key={portion.id}
                      className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-secondary/50 dark:bg-[#1E1711] border border-border"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-extrabold text-foreground">
                          {portionName}
                        </span>
                      </div>
                      <span className="font-heading font-black text-sm sm:text-base text-primary">
                        ₺{Number(portion.fiyat).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Badges / Features list */}
          {hasAnyBadges && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {isChefSpecial && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  ⭐ Şefin Özel Önerisi
                </span>
              )}
              {prepTime && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-secondary text-foreground/80 border border-border">
                  ⏱️ {prepTime}
                </span>
              )}
              {isVegetarian && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  🌱 Vejetaryen
                </span>
              )}
              {isVegan && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-600/15 text-green-600 dark:text-green-400 border border-green-600/30">
                  🌿 Vegan
                </span>
              )}
              {isSpicy && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  🌶️ Acılı
                </span>
              )}
              {isCold && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                  ❄️ Soğuk
                </span>
              )}
              {hasCaffeine && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                  ☕ Kafeinli
                </span>
              )}
            </div>
          )}

          {/* Sold Out Notice */}
          {!product.aktif && (
            <div className="flex gap-2 p-3.5 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-xs items-center">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="font-bold">{t('soldOutDesc')}</span>
            </div>
          )}

          {/* Allergens Info */}
          {hasAllergens && (
            <div className="flex gap-2 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs items-start">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold mr-1">{t('allergens')}:</span>
                <span>{allergens.join(", ")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Price showcase + Close button) */}
        <div className="p-5 sm:p-6 border-t border-border bg-card text-foreground flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-foreground/60 font-black">
              {hasPortions && minPortionPrice !== maxPortionPrice
                ? (lang === 'tr' ? "FİYAT ARALIĞI" : "PRICE RANGE")
                : (lang === 'tr' ? "FİYAT" : "PRICE")}
            </span>
            <span className="font-heading font-black text-2xl sm:text-3xl text-primary">
              {hasPortions && minPortionPrice !== maxPortionPrice
                ? `₺${minPortionPrice.toFixed(0)} - ₺${maxPortionPrice.toFixed(0)}`
                : `₺${Number(product.fiyat).toFixed(2)}`}
            </span>
          </div>

          <Button
            type="button"
            onClick={onClose}
            className="px-6 py-5 rounded-2xl font-bold text-xs uppercase bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all cursor-pointer"
          >
            {lang === 'tr' ? "Menüye Dön" : "Back to Menu"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
