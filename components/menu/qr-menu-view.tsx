"use client"

import React, { useState, useEffect, useRef } from "react"
import { TableProvider, useTable } from "@/lib/context/table-context"
import { Category, Product } from "@/lib/types/database"
import { CategoryNav } from "@/components/menu/category-nav"
import { ProductCard } from "@/components/menu/product-card"
import { ProductDetailDialog } from "@/components/menu/product-detail-dialog"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { YaliPreloader } from "@/components/ui/yali-preloader"
import { RegisterServiceWorker } from "@/components/pwa/register-sw"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { QrLockScreen } from "@/components/menu/qr-lock-screen"
import { DeveloperFooter } from "@/components/menu/developer-footer"
import { isQrSessionValid, grantQrSession } from "@/lib/security/qr-session"
import { Play, Search, X, UtensilsCrossed } from "lucide-react"

function MenuMainContent() {
  const { categories, products, isLoading, lang } = useTable();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replayPreloader, setReplayPreloader] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleSearch = () => {
    setIsSearchOpen(prev => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      } else {
        setSearchQuery("");
      }
      return next;
    });
  };

  const activeCategory = selectedCategoryId ?? categories[0]?.id ?? null;

  if (isLoading && products.length === 0) {
    return <LoadingSkeleton />;
  }

  // Active or displayed products
  const isSearching = isSearchOpen && searchQuery.trim().length > 0;
  const q = searchQuery.trim().toLowerCase();

  const filteredProducts = isSearching
    ? products.filter(p => {
        const matchTr = (p.ad_tr || "").toLowerCase().includes(q);
        const matchEn = (p.ad_en || "").toLowerCase().includes(q);
        const matchDescTr = (p.aciklama_tr || "").toLowerCase().includes(q);
        const matchDescEn = (p.aciklama_en || "").toLowerCase().includes(q);
        const matchAllergens = (p.ozellikler?.alerjenler || []).some(a => a.toLowerCase().includes(q));
        const matchTag =
          (q.includes("veg") && (p.ozellikler?.vejetaryen || p.ozellikler?.vegan)) ||
          ((q.includes("acı") || q.includes("aci")) && p.ozellikler?.acili) ||
          ((q.includes("soğuk") || q.includes("soguk")) && (p.ozellikler?.soğuk || p.ozellikler?.soguk)) ||
          ((q.includes("şef") || q.includes("sef")) && p.ozellikler?.sef_onerisi) ||
          (q.includes("kahve") && p.ozellikler?.kafein);

        return matchTr || matchEn || matchDescTr || matchDescEn || matchAllergens || matchTag;
      })
    : activeCategory
    ? products.filter(p => p.kategori_id === activeCategory)
    : products;

  return (
    <>
      {/* PWA: service worker kaydı + ana ekrana ekleme */}
      <RegisterServiceWorker />
      <InstallPrompt />

      {/* Yalı 3D Leaf Opening Entrance Preloader Animasyonu */}
      <YaliPreloader
        forcePlay={replayPreloader}
        tableName="Yalı Restaurant"
        tableNo={1}
        onComplete={() => setReplayPreloader(false)}
      />

      <div className="flex-1 flex flex-col w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto pb-24 min-h-screen relative bg-gradient-to-br from-[#B98A4A]/5 via-transparent to-[#D8C4A0]/5">
        
        {/* Category Nav Header */}
        <CategoryNav
          activeCategory={isSearching ? null : activeCategory}
          onCategoryChange={(catId) => {
            setSelectedCategoryId(catId);
            if (isSearching) {
              setSearchQuery("");
              setIsSearchOpen(false);
            }
          }}
          isSearchOpen={isSearchOpen}
          onToggleSearch={toggleSearch}
        />

        {/* Search Bar Input Overlay */}
        {isSearchOpen && (
          <div className="px-3.5 sm:px-4 pt-3 pb-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-foreground/45" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={lang === 'tr' ? "Yemek, içecek, tatlı veya alerjen ara..." : "Search dishes, drinks, desserts..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-secondary/70 dark:bg-card border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm font-semibold text-foreground outline-none transition-all placeholder:text-foreground/40 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 p-1 rounded-full hover:bg-muted text-foreground/45 hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {isSearching && (
              <div className="mt-2 px-1 flex items-center justify-between text-[11px] font-bold text-foreground/55">
                <span>&ldquo;{searchQuery}&rdquo; için {filteredProducts.length} sonuç</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="text-primary hover:underline cursor-pointer"
                >
                  Aramayı Temizle
                </button>
              </div>
            )}
          </div>
        )}

        {/* Category Description Banner */}
        {!isSearching && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading font-black text-xl sm:text-2xl text-foreground tracking-wide">
                  {categories.find(c => c.id === activeCategory)?.[lang === 'tr' ? 'ad_tr' : 'ad_en'] || (lang === 'tr' ? 'Menü' : 'Menu')}
                </h1>
                <p className="text-[11px] sm:text-xs text-foreground/60 font-semibold mt-0.5">
                  {lang === 'tr' ? 'Özenle seçilmiş gurme lezzetler' : 'Carefully crafted gourmet selections'}
                </p>
              </div>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {filteredProducts.length} {lang === 'tr' ? 'Çeşit' : 'Items'}
              </span>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="px-3.5 sm:px-4 pt-2">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="p-4 rounded-full bg-primary/10 text-primary border border-primary/20 mb-3">
                <UtensilsCrossed className="h-8 w-8" />
              </div>
              <h3 className="font-heading font-bold text-base text-foreground">
                {lang === 'tr' ? 'Bu kategoride henüz ürün bulunmuyor' : 'No items found in this category'}
              </h3>
              <p className="text-xs text-foreground/60 mt-1 max-w-xs">
                {lang === 'tr' ? 'Lütfen diğer lezzet kategorilerimize göz atın.' : 'Please explore our other delicious categories.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Preloader Replay Helper at Bottom */}
        <div className="mt-10 mb-4 flex justify-center px-4">
          <button
            type="button"
            onClick={() => setReplayPreloader(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary/80 hover:bg-secondary text-[11px] sm:text-xs font-bold text-foreground/60 hover:text-foreground border border-border cursor-pointer transition-all shadow-xs"
          >
            <Play className="h-3 w-3 text-primary" />
            <span>Açılış Animasyonunu Tekrar Oynat</span>
          </button>
        </div>

        {/* Developer Attribution & Contact Footer */}
        <DeveloperFooter />

        {/* Product Detail Dialog (Photo, Allergens, Info) */}
        <ProductDetailDialog
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      </div>
    </>
  );
}

export function QrMenuView({
  initialCategories = [],
  initialProducts = []
}: {
  initialCategories?: Category[];
  initialProducts?: Product[];
}) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const qrParam = params.get("qr");
    const tableParam = params.get("table");
    const isStaff = !!localStorage.getItem("yali_user");

    // 1. If scanned with physical QR code (?qr=... or ?table=...)
    if (qrParam || tableParam) {
      grantQrSession();
      setHasAccess(true);
      // Clean query parameter from address bar so sharing URL only shares /menu (which locks outside)
      try {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, "", cleanUrl);
      } catch {}
      return;
    }

    // 2. If staff is logged in, grant access for testing
    if (isStaff) {
      grantQrSession();
      setHasAccess(true);
      return;
    }

    // 3. Verify if user has an active 2-hour QR session
    if (isQrSessionValid()) {
      setHasAccess(true);
    } else {
      setHasAccess(false);
    }
  }, []);

  if (hasAccess === null) {
    return <LoadingSkeleton />;
  }

  if (!hasAccess) {
    return <QrLockScreen />;
  }

  return (
    <TableProvider initialCategories={initialCategories} initialProducts={initialProducts}>
      <MenuMainContent />
    </TableProvider>
  );
}
