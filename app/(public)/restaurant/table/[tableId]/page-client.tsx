"use client"

import React, { useState } from "react"
import { TableProvider, useTable } from "@/lib/context/table-context"
import { Category, Product } from "@/lib/types/database"
import { CategoryNav } from "@/components/menu/category-nav"
import { ProductCard } from "@/components/menu/product-card"
import { ProductDetailDialog } from "@/components/menu/product-detail-dialog"
import { CartBar } from "@/components/cart/cart-bar"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { StatusBanner } from "@/components/ui/status-banner"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { YaliPreloader } from "@/components/ui/yali-preloader"
import { RegisterServiceWorker } from "@/components/pwa/register-sw"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { isMockMode } from "@/lib/supabase/client"
import { Info, Sparkles, Play, Search, X, UtensilsCrossed } from "lucide-react"

interface TablePageClientProps {
  tableId: string;
  token: string;
  tableNo: number;
  tableName?: string;
  initialCategories: Category[];
  initialProducts: Product[];
}

function MenuContent({ tableNo, tableName }: { tableNo: number; tableName?: string }) {
  const { categories, products, isLoading, lang, t } = useTable();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [replayPreloader, setReplayPreloader] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

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

  // Derived: fall back to the first category until the user picks one
  const activeCategory = selectedCategoryId ?? categories[0]?.id ?? null;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Active products only
  const activeProducts = products.filter(p => p.aktif !== false);

  // Filter products by search query or selected category
  const isSearching = isSearchOpen && searchQuery.trim().length > 0;
  const q = searchQuery.trim().toLowerCase();

  const filteredProducts = isSearching
    ? activeProducts.filter(p => {
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
    ? activeProducts.filter(p => p.kategori_id === activeCategory)
    : activeProducts;

  return (
    <>
      {/* PWA: service worker kaydı + ana ekrana ekleme teşviki */}
      <RegisterServiceWorker />
      <InstallPrompt />

      {/* Yalı 3D Leaf Opening Entrance Preloader */}
      <YaliPreloader
        forcePlay={replayPreloader}
        tableName={tableName}
        tableNo={tableNo}
        onComplete={() => setReplayPreloader(false)}
      />

      <div className="flex-1 flex flex-col w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto pb-36 min-h-screen relative bg-gradient-to-br from-[#B98A4A]/5 via-transparent to-[#D8C4A0]/5">
        {/* Status Banner */}
        <StatusBanner />

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

        {/* Table Number Banner */}
        <div className="px-3 sm:px-4 mt-3">
          <div className="p-4 sm:p-5 rounded-3xl glass-panel text-center relative overflow-hidden border border-border shadow-sm">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/15 rounded-full blur-2xl pointer-events-none" />
            <h1 className="font-heading font-black text-xl sm:text-2xl text-primary leading-tight flex items-center justify-center gap-1.5">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              {tableName ? tableName : t('tableNo').replace('{no}', String(tableNo))}
            </h1>
            <p className="text-[10px] sm:text-xs text-foreground/60 mt-1 uppercase tracking-widest font-bold">
              {t('welcome')}
            </p>
          </div>
        </div>

        {/* Expandable Search Input (Only shown when search button is clicked) */}
        {isSearchOpen && (
          <div className="px-3 sm:px-4 mt-3 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="relative flex items-center w-full">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                <Search className="h-4 w-4" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                autoFocus
                className="w-full pl-10 pr-24 py-3 text-xs sm:text-sm rounded-2xl glass-panel border border-primary/50 bg-card/95 text-foreground placeholder:text-foreground/45 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-lg"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1.5 rounded-full text-foreground/40 hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
                    title={t('clearSearch')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="px-2.5 py-1 text-[11px] font-extrabold rounded-xl bg-secondary/80 hover:bg-secondary text-foreground/70 hover:text-foreground transition-all cursor-pointer border border-border"
                >
                  {lang === 'tr' ? "Kapat" : "Close"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mock warning badge */}
        {isMockMode && (
          <div className="mx-3 sm:mx-4 mt-3 p-3 bg-primary/10 border border-primary/20 text-primary text-xs rounded-2xl flex items-start gap-2 shadow-inner">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col text-left">
              <span className="font-black">{t('mockModeWarning')}</span>
              <span className="opacity-80 mt-0.5 text-[10px] font-medium">
                Sipariş verdiğinizde doğrudan garson paneline düşer. Yalnızca garson onayladığında &quot;Mutfakta Hazırlanıyor&quot; durumuna geçer.
              </span>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="px-3 sm:px-4 mt-5">
          <div className="flex items-center justify-between px-1 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-black text-base sm:text-lg text-foreground">
                {isSearching ? (
                  <span className="flex items-center gap-1.5 text-primary">
                    <Search className="h-4 w-4" />
                    {t('searchResults')}
                  </span>
                ) : (
                  activeCategory && (
                    lang === 'tr'
                      ? categories.find(c => c.id === activeCategory)?.ad_tr
                      : categories.find(c => c.id === activeCategory)?.ad_en
                  )
                )}
              </h2>
              {isSearching && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[11px] font-bold text-foreground/50 hover:text-primary transition-colors underline cursor-pointer"
                >
                  ({t('clearSearch')})
                </button>
              )}
            </div>
            <span className="text-[11px] sm:text-xs text-foreground/50 font-bold">
              {filteredProducts.length} {t('pieces')}
            </span>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="p-8 rounded-3xl glass-panel flex flex-col items-center justify-center text-center gap-3 border border-border mt-2">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                {isSearching ? <Search className="h-6 w-6" /> : <UtensilsCrossed className="h-6 w-6" />}
              </div>
              <p className="text-sm font-bold text-foreground/80">
                {isSearching ? t('noSearchResults') : "Bu kategoride ürün bulunamadı."}
              </p>
              {isSearching && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                >
                  {t('clearSearch')}
                </button>
              )}
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
        <div className="mt-8 mb-4 flex justify-center px-4">
          <button
            type="button"
            onClick={() => setReplayPreloader(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary/80 hover:bg-secondary text-[11px] sm:text-xs font-bold text-foreground/60 hover:text-foreground border border-border cursor-pointer transition-all shadow-xs"
          >
            <Play className="h-3 w-3 text-primary" />
            <span>Açılış Animasyonunu Tekrar Oynat</span>
          </button>
        </div>

        {/* Product Detail Dialog */}
        <ProductDetailDialog
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />

        {/* Bottom Cart Action Bar */}
        <CartBar onOpenCart={() => setIsCartOpen(true)} />

        {/* Cart Drawer */}
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </>
  );
}

export function TablePageClient({
  tableId,
  token,
  tableNo,
  tableName,
  initialCategories,
  initialProducts
}: TablePageClientProps) {
  return (
    <TableProvider
      tableId={tableId}
      token={token}
      initialCategories={initialCategories}
      initialProducts={initialProducts}
    >
      <MenuContent tableNo={tableNo} tableName={tableName} />
    </TableProvider>
  );
}
