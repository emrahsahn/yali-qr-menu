"use client"

import React from "react"
import { Product } from "@/lib/types/database"
import { useTable } from "@/lib/context/table-context"
import Image from "next/image"
import { Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function ProductCard({
  product,
  onClick
}: {
  product: Product;
  onClick: () => void;
}) {
  const { lang, t } = useTable();

  const ad = lang === 'tr' ? product.ad_tr : product.ad_en;
  const aciklama = lang === 'tr' ? product.aciklama_tr : product.aciklama_en;

  const isVegetarian = !!product.ozellikler?.vejetaryen;
  const isVegan = !!product.ozellikler?.vegan;
  const isSpicy = !!product.ozellikler?.acili;
  const isCold = !!product.ozellikler?.soğuk || !!product.ozellikler?.soguk;
  const hasCaffeine = !!product.ozellikler?.kafein;
  const isChefSpecial = !!product.ozellikler?.sef_onerisi;
  const prepTime = typeof product.ozellikler?.hazirlama_suresi === 'string' ? product.ozellikler.hazirlama_suresi : undefined;

  const isSoldOut = !product.aktif;

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden rounded-2xl glass-panel glass-panel-hover cursor-pointer p-3 transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-lg border-border ${
        isSoldOut ? "opacity-75 grayscale-[35%] bg-card/60" : ""
      }`}
    >
      {/* Product Image wrapper */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
        <Image
          src={product.gorsel_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60"}
          alt={ad}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, 50vw"
          className={`object-cover transition-transform duration-500 ${
            isSoldOut ? "" : "group-hover:scale-108"
          }`}
          loading="lazy"
        />

        {/* Sold Out Full Image Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="bg-destructive text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg border border-white/20">
              {t('soldOut')}
            </span>
          </div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isChefSpecial && (
            <Badge className="bg-amber-600/90 text-white backdrop-blur border-none text-[10px] py-0 px-2 font-semibold">
              ⭐ Şefin Özel
            </Badge>
          )}
          {isVegetarian && (
            <Badge className="bg-emerald-500/90 text-white backdrop-blur border-none text-[10px] py-0 px-2 font-semibold">
              🌱 Veg
            </Badge>
          )}
          {isVegan && (
            <Badge className="bg-green-600/90 text-white backdrop-blur border-none text-[10px] py-0 px-2 font-semibold">
              🌿 Vegan
            </Badge>
          )}
          {isSpicy && (
            <Badge className="bg-rose-600/90 text-white backdrop-blur border-none text-[10px] py-0 px-2 font-semibold">
              🌶️ Acılı
            </Badge>
          )}
          {isCold && (
            <Badge className="bg-sky-600/90 text-white backdrop-blur border-none text-[10px] py-0 px-2 font-semibold">
              ❄️ Soğuk
            </Badge>
          )}
          {hasCaffeine && (
            <Badge className="bg-orange-600/90 text-white backdrop-blur border-none text-[10px] py-0 px-2 font-semibold">
              ☕ Kafein
            </Badge>
          )}
        </div>

        {/* Prep Time Overlay */}
        {prepTime && !isSoldOut && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[10px] py-0.5 px-2 rounded-full backdrop-blur-sm z-10">
            <Clock className="h-3 w-3 text-amber-400" />
            <span>{prepTime}</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="mt-3 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-heading font-black text-sm leading-tight text-foreground duration-200 ${
            isSoldOut ? "text-foreground/70" : "group-hover:text-primary transition-colors"
          }`}>
            {ad}
          </h3>
          <span className={`font-heading font-black text-xs whitespace-nowrap px-2 py-0.5 rounded-md border ${
            isSoldOut 
              ? "bg-muted text-foreground/50 border-border line-through" 
              : "text-primary bg-primary/10 border-primary/20"
          }`}>
            ₺{Number(product.fiyat).toFixed(2)}
          </span>
        </div>
        
        {aciklama && (
          <p className="mt-1 text-[11px] text-foreground/60 line-clamp-2 leading-relaxed font-medium">
            {aciklama}
          </p>
        )}
      </div>
    </div>
  );
}
