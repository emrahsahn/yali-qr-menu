"use client"

import React, { useState, useEffect } from "react"
import { OrderSession, CartItem, Product, Category } from "@/lib/types/database"
import { useStaff } from "@/lib/context/staff-context"
import { X, Plus, Minus, Trash2, Search, Edit3, Check, ShoppingBag } from "lucide-react"

interface OrderEditModalProps {
  order: OrderSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderEditModal({ order, isOpen, onClose }: OrderEditModalProps) {
  const { updateOrderCartItems } = useStaff()

  const [items, setItems] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"items" | "add">("items")
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null)

  // Live menu data so the waiter can add real products in both modes
  const [menuProducts, setMenuProducts] = useState<Product[]>([])
  const [menuCategories, setMenuCategories] = useState<Category[]>([])

  const orderId = order?.id || ""
  const [lastSyncedKey, setLastSyncedKey] = useState<string | null>(null)

  // Reset editable items each time the dialog opens for a given order
  // (adjusting state during render instead of inside an effect).
  if (isOpen && order) {
    const syncKey = `${orderId}:${String(isOpen)}`
    if (lastSyncedKey !== syncKey) {
      setLastSyncedKey(syncKey)
      setItems(JSON.parse(JSON.stringify(order.cart_items || [])))
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    Promise.resolve().then(async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories")
        ]);
        const prodData = await prodRes.json()
        const catData = await catRes.json()
        if (!active) return;
        if (Array.isArray(prodData.products)) setMenuProducts(prodData.products)
        if (Array.isArray(catData.categories)) setMenuCategories(catData.categories)
      } catch {}
    });
    return () => {
      active = false;
    };
  }, [isOpen])

  if (!isOpen || !order) return null

  const handleUpdateAdet = (itemId: string, delta: number) => {
    setItems(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newAdet = item.adet + delta
          return newAdet > 0 ? { ...item, adet: newAdet } : null
        }
        return item
      }).filter(Boolean) as CartItem[]
    })
  }

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  const handleAddProduct = (product: Product) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(i => i.product_id === product.id)
      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          adet: updated[existingIndex].adet + 1
        }
        return updated
      } else {
        const newItem: CartItem = {
          id: "m_item_" + Math.random().toString(36).substring(2, 9),
          session_id: order.id,
          product_id: product.id,
          adet: 1,
          not_text: null,
          created_at: new Date().toISOString(),
          product
        }
        return [...prev, newItem]
      }
    })

    // Feedback effect
    setRecentlyAddedId(product.id)
    setTimeout(() => setRecentlyAddedId(null), 1200)
  }

  const handleSave = () => {
    updateOrderCartItems(order.id, items)
    onClose()
  }

  const filteredProducts = menuProducts.filter(p => {
    const matchesSearch =
      p.ad_tr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ad_en.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategoryId ? p.kategori_id === selectedCategoryId : true
    return matchesSearch && matchesCategory
  })

  const totalItemCount = items.reduce((acc, i) => acc + i.adet, 0)
  const totalPrice = items.reduce((acc, item) => acc + (item.product?.fiyat || 0) * item.adet, 0)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-3xl border-white/20 dark:border-black/10 max-w-lg w-full text-left flex flex-col gap-5 relative animate-in fade-in zoom-in duration-200 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <Edit3 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-foreground">
                Siparişi Düzenle — {order.table_name || `Masa ${order.table_no}`}
              </h2>
              <p className="text-xs text-foreground/60 font-semibold mt-0.5">
                Garson olarak ürünü ekleyin, miktarını değiştirin veya çıkarın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-foreground/50 hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-border pb-2 shrink-0">
          <button
            onClick={() => setActiveTab("items")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "items"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-foreground/70 hover:bg-muted"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Mevcut Ürünler ({totalItemCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "add"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-foreground/70 hover:bg-muted"
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Ürün Ekle</span>
          </button>
        </div>

        {/* Tab 1: Current Items */}
        {activeTab === "items" && (
          <div className="overflow-y-auto pr-1 flex flex-col gap-3 min-h-[240px]">
            {items.length === 0 ? (
              <div className="py-12 text-center text-xs text-foreground/50 italic border border-dashed border-border rounded-2xl">
                Siparişte ürün bulunmuyor. Üstteki &quot;Yeni Ürün Ekle&quot; butonuna basarak ekleyebilirsiniz.
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/10 dark:border-black/10 flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col">
                    <span className="font-heading font-black text-sm text-foreground">
                      {item.product?.ad_tr}
                    </span>
                    <span className="text-xs text-primary font-bold">
                      ₺{((item.product?.fiyat || 0) * item.adet).toLocaleString("tr-TR")} (₺{item.product?.fiyat}/adet)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-2 py-1">
                      <button
                        onClick={() => handleUpdateAdet(item.id, -1)}
                        className="p-1 hover:bg-muted rounded-lg text-foreground/70 cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-heading font-black text-sm w-5 text-center">
                        {item.adet}
                      </span>
                      <button
                        onClick={() => handleUpdateAdet(item.id, 1)}
                        className="p-1 hover:bg-muted rounded-lg text-foreground/70 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Add Product from Menu */}
        {activeTab === "add" && (
          <div className="flex flex-col gap-3 min-h-[240px]">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <input
                type="text"
                placeholder="Ürün ismi ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Category Button Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryId === null
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-white/40 dark:bg-black/20 text-foreground/70 hover:bg-muted border border-border/50"
                }`}
              >
                Tümü
              </button>
              {menuCategories.map(cat => {
                const isSelected = selectedCategoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-white/40 dark:bg-black/20 text-foreground/70 hover:bg-muted border border-border/50"
                    }`}
                  >
                    {cat.ad_tr}
                  </button>
                )
              })}
            </div>

            {/* Products List */}
            <div className="overflow-y-auto max-h-52 pr-1 flex flex-col gap-2">
              {filteredProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-foreground/50 italic border border-dashed border-border rounded-xl">
                  Bu kategoride veya aramada ürün bulunamadı.
                </div>
              ) : (
                filteredProducts.map(product => {
                  const existingInCart = items.find(i => i.product_id === product.id)
                  const isJustAdded = recentlyAddedId === product.id

                  return (
                    <div
                      key={product.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 text-left ${
                        existingInCart
                          ? "bg-primary/5 border-primary/30"
                          : "bg-white/30 dark:bg-black/20 hover:bg-muted border-white/10"
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-xs text-foreground">
                            {product.ad_tr}
                          </span>
                          {existingInCart && (
                            <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-md">
                              {existingInCart.adet} adet ekli
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-primary font-black">
                          ₺{product.fiyat.toLocaleString("tr-TR")}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddProduct(product)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                          isJustAdded
                            ? "bg-emerald-600 text-white scale-105"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Eklendi
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" /> Ekle
                          </>
                        )}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border pt-4 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-foreground/50">
              Güncellenmiş Toplam ({totalItemCount} Ürün):
            </span>
            <span className="font-heading font-black text-lg text-primary">
              ₺{totalPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-foreground/70 hover:bg-muted transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              onClick={handleSave}
              className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-black text-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Check className="h-4 w-4" />
              Değişiklikleri Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
