"use client"

import React, { useState, useEffect } from "react"
import { Table, Product, Category, CartItem } from "@/lib/types/database"
import { mockCategories, mockProducts, mockTables } from "@/lib/supabase/mock-data"
import { useStaff } from "@/lib/context/staff-context"
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Utensils,
  ShoppingBag,
  Check,
  QrCode,
  ArrowRight,
  FileText,
  ChevronDown
} from "lucide-react"

interface WaiterOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTableId?: string | null;
}

export function WaiterOrderModal({
  isOpen,
  onClose,
  initialTableId
}: WaiterOrderModalProps) {
  const { allTables, activeWaiter, createWaiterOrder, orders } = useStaff()

  const [categories, setCategories] = useState<Category[]>(mockCategories)
  const [products, setProducts] = useState<Product[]>(mockProducts)

  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [tableSearchQuery, setTableSearchQuery] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [itemNotes, setItemNotes] = useState<{ [itemId: string]: string }>({})
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null)
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null)

  // Load products & categories from API or mock
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch("/api/products?venue=restaurant").catch(() => null),
          fetch("/api/categories?venue=restaurant").catch(() => null)
        ])

        if (pRes && pRes.ok) {
          const pData = await pRes.json()
          if (pData.products && pData.products.length > 0) {
            setProducts(pData.products)
          }
        }
        if (cRes && cRes.ok) {
          const cData = await cRes.json()
          if (cData.categories && cData.categories.length > 0) {
            setCategories(cData.categories)
          }
        }
      } catch (e) {
        console.error("Error loading products/categories:", e)
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  // Derived: fall back to mock tables until the context list is loaded
  const tablesList = (allTables && allTables.length > 0) ? allTables : mockTables

  // Reset per-open state during render (guarded by a sync key) instead of
  // inside an effect body.
  const [openSyncKey, setOpenSyncKey] = useState<string | null>(null)
  if (isOpen) {
    const syncKey = `open:${initialTableId ?? "none"}:${tablesList.length}`
    if (openSyncKey !== syncKey) {
      setOpenSyncKey(syncKey)
      if (initialTableId) {
        const target = tablesList.find(t => t.id === initialTableId)
        if (target) {
          setSelectedTable(target)
        }
      } else {
        setSelectedTable(null)
      }
      setCartItems([])
      setItemNotes({})
      setSearchQuery("")
      setTableSearchQuery("")
      setIsSuccess(false)
      setIsSubmitting(false)
      setIsMobileCartOpen(false)
    }
  }

  if (!isOpen) return null

  // Helper: Find if a table has an active session
  const getTableActiveSession = (tableId: string) => {
    return orders.find(o => o.table_id === tableId && o.status !== "closed")
  }

  // Filter products by category & search
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategoryId ? p.kategori_id === selectedCategoryId : true
    const matchesSearch = searchQuery.trim() === "" ||
      p.ad_tr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ad_en.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch && p.aktif
  })

  // Filter tables by search
  const filteredTables = tablesList.filter(t => {
    const tName = t.masa_adi || `Masa ${t.masa_no}`
    return tName.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
      String(t.masa_no).includes(tableSearchQuery)
  })

  // Product addition to POS cart
  const handleAddProduct = (product: Product) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.product_id === product.id)
      if (existingIdx > -1) {
        const updated = [...prev]
        updated[existingIdx] = {
          ...updated[existingIdx],
          adet: updated[existingIdx].adet + 1
        }
        return updated
      } else {
        const newItemId = "pos_item_" + Math.random().toString(36).substring(2, 9)
        const newItem: CartItem = {
          id: newItemId,
          session_id: "temp_session",
          product_id: product.id,
          adet: 1,
          not_text: null,
          created_at: new Date().toISOString(),
          product
        }
        return [...prev, newItem]
      }
    })

    setRecentlyAddedId(product.id)
    setTimeout(() => setRecentlyAddedId(null), 800)
  }

  const handleUpdateAdet = (itemId: string, delta: number) => {
    setCartItems(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) {
          const newAdet = item.adet + delta
          return newAdet > 0 ? { ...item, adet: newAdet } : null
        }
        return item
      }).filter(Boolean) as CartItem[]

      if (updated.length === 0) {
        setIsMobileCartOpen(false)
      }
      return updated
    })
  }

  const handleRemoveItem = (itemId: string) => {
    setCartItems(prev => {
      const updated = prev.filter(i => i.id !== itemId)
      if (updated.length === 0) {
        setIsMobileCartOpen(false)
      }
      return updated
    })
  }

  const handleUpdateNote = (itemId: string, note: string) => {
    setItemNotes(prev => ({ ...prev, [itemId]: note }))
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, not_text: note.trim() || null }
      }
      return item
    }))
  }

  // Totals
  const totalItemCount = cartItems.reduce((acc, i) => acc + i.adet, 0)
  const totalPrice = cartItems.reduce((acc, item) => acc + (item.product?.fiyat || 0) * item.adet, 0)

  // Submit Order
  const handleConfirmAndSubmit = async () => {
    if (!selectedTable || cartItems.length === 0) return

    setIsSubmitting(true)
    try {
      // Ensure notes are attached
      const itemsToSubmit = cartItems.map(item => ({
        ...item,
        not_text: itemNotes[item.id] || item.not_text || null
      }))

      await createWaiterOrder(selectedTable.id, itemsToSubmit, true)
      setIsSuccess(true)
      setIsMobileCartOpen(false)

      setTimeout(() => {
        setIsSuccess(false)
        onClose()
      }, 1500)
    } catch (e) {
      console.error("Error submitting waiter order:", e)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="glass-panel border-white/20 dark:border-black/10 bg-card text-foreground rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh] h-[92vh] md:h-auto overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-border bg-gradient-to-r from-primary/10 via-card to-card shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-primary/20 text-primary rounded-2xl border border-primary/30 shadow-inner">
              <Utensils className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-base sm:text-xl text-foreground">
                  Garson Sipariş Alma (POS)
                </span>
                <span className="bg-primary/15 text-primary text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full border border-primary/30">
                  Mutfak Direkt
                </span>
              </div>
              <p className="hidden sm:block text-xs text-foreground/60 font-semibold">
                Masadan bizzat alınan siparişleri doğrudan mutfağa iletin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Cart Trigger in Header if cart has items */}
            {selectedTable && cartItems.length > 0 && (
              <button
                onClick={() => setIsMobileCartOpen(prev => !prev)}
                className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-primary text-white text-xs font-black shadow-md cursor-pointer active:scale-95 transition-all"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{totalItemCount}</span>
                <span className="opacity-80 font-normal">|</span>
                <span>₺{totalPrice.toFixed(0)}</span>
              </button>
            )}

            {/* Active Waiter Badge */}
            {activeWaiter && (
              <div className="hidden sm:flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-2xl border border-border">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${activeWaiter.avatarColor}`}>
                  {activeWaiter.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-foreground">{activeWaiter.name}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-2xl text-foreground/60 hover:text-foreground hover:bg-secondary border border-border transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4 text-center animate-in fade-in zoom-in duration-300 my-auto">
            <div className="p-5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 animate-bounce">
              <CheckCircle className="h-16 w-16" />
            </div>
            <h2 className="font-heading font-black text-2xl text-foreground">
              Sipariş Mutfağa İletildi!
            </h2>
            <p className="text-sm text-foreground/70 font-semibold max-w-sm">
              {selectedTable?.masa_adi || `Masa ${selectedTable?.masa_no}`} siparişi 
              <strong> {activeWaiter?.name || "Görevli"} </strong> tarafından onaylandı ve mutfak ekranına aktarıldı.
            </p>
          </div>
        ) : (
          /* Main Content Body */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
            
            {/* STEP 1: If No Table Selected, Show Table Picker Screen */}
            {!selectedTable ? (
              <div className="flex-1 p-4 sm:p-7 flex flex-col gap-4 sm:gap-5 overflow-y-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <h3 className="font-heading font-black text-base sm:text-lg text-foreground flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-primary" />
                      <span>1. Adım: Sipariş Alınacak Masayı Seçin</span>
                    </h3>
                    <p className="text-xs text-foreground/60 font-semibold mt-0.5">
                      Siparişi hangi masa için açmak istiyorsanız tıklayın.
                    </p>
                  </div>

                  {/* Table Search */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/45" />
                    <input
                      type="text"
                      placeholder="Masa ara (Örn: Dış 1, 2...)"
                      value={tableSearchQuery}
                      onChange={e => setTableSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-secondary/70 border border-border focus:outline-none focus:border-primary text-foreground placeholder:text-foreground/45"
                    />
                  </div>
                </div>

                {/* Tables Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5 pb-6">
                  {filteredTables.map(table => {
                    const activeSession = getTableActiveSession(table.id)
                    const isOccupied = !!activeSession
                    const tName = table.masa_adi || `Masa ${table.masa_no}`
                    const sessionItemCount = activeSession?.cart_items?.reduce((a, b) => a + b.adet, 0) || 0

                    return (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTable(table)}
                        className={`p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-98 cursor-pointer shadow-sm relative overflow-hidden ${
                          isOccupied
                            ? "bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/30"
                            : "bg-secondary/50 hover:bg-secondary/90 border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-black text-sm sm:text-base text-foreground">
                            {tName}
                          </span>
                          <span className={`w-2.5 h-2.5 rounded-full ${isOccupied ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] sm:text-[11px] text-foreground/50 font-bold uppercase tracking-wider">
                            No: {table.masa_no}
                          </span>
                          {isOccupied ? (
                            <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-lg w-fit border border-amber-500/20">
                              Dolu ({sessionItemCount} Ürün)
                            </span>
                          ) : (
                            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-lg w-fit border border-emerald-500/20">
                              Boş Masa
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end text-primary font-bold text-xs pt-1 border-t border-border/50">
                          <span>Sipariş Gir</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* STEP 2: POS Product Selection & Cart */
              <>
                {/* Product Catalog Column */}
                <div className="flex-1 flex flex-col border-r-0 md:border-r border-border overflow-hidden min-h-0 bg-background/50 relative">
                  
                  {/* Selected Table Sub-Bar */}
                  <div className="p-3 sm:px-4 bg-secondary/50 border-b border-border flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/20 text-primary p-1.5 rounded-xl">
                        <QrCode className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-heading font-black text-xs sm:text-sm text-foreground">
                          {selectedTable.masa_adi || `Masa ${selectedTable.masa_no}`}
                        </span>
                        <span className="text-[10px] text-foreground/50 font-bold uppercase">
                          No: {selectedTable.masa_no}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedTable(null)
                        setIsMobileCartOpen(false)
                      }}
                      className="text-xs font-bold text-primary hover:underline px-2.5 py-1 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      Masa Değiştir
                    </button>
                  </div>

                  {/* Search and Category Filter */}
                  <div className="p-3 sm:p-4 border-b border-border flex flex-col gap-2.5 shrink-0">
                    {/* Search */}
                    <div className="relative w-full">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/45" />
                      <input
                        type="text"
                        placeholder="Menüde ürün ara (kebap, kahve, salata...)"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 sm:py-2.5 text-xs rounded-xl bg-card border border-border focus:outline-none focus:border-primary text-foreground placeholder:text-foreground/45 shadow-sm font-medium"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      <button
                        onClick={() => setSelectedCategoryId(null)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          selectedCategoryId === null
                            ? "bg-primary text-white shadow-sm"
                            : "bg-card hover:bg-secondary text-foreground/75 border border-border"
                        }`}
                      >
                        Tümü ({products.length})
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                            selectedCategoryId === cat.id
                              ? "bg-primary text-white shadow-sm"
                              : "bg-card hover:bg-secondary text-foreground/75 border border-border"
                          }`}
                        >
                          {cat.ad_tr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Products Grid - Takes full height on mobile */}
                  <div className="flex-1 p-3 sm:p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pb-24 md:pb-4">
                    {filteredProducts.length === 0 ? (
                      <div className="col-span-full py-16 text-center text-foreground/45 font-semibold text-xs italic">
                        Aramanıza uygun ürün bulunamadı.
                      </div>
                    ) : (
                      filteredProducts.map(product => {
                        const inCartCount = cartItems.find(i => i.product_id === product.id)?.adet || 0
                        const isRecentlyAdded = recentlyAddedId === product.id

                        return (
                          <div
                            key={product.id}
                            onClick={() => handleAddProduct(product)}
                            className={`group relative p-3 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 shadow-sm select-none ${
                              isRecentlyAdded ? "ring-2 ring-primary scale-[0.98]" : "hover:shadow-md"
                            }`}
                          >
                            {/* Quantity in cart badge */}
                            {inCartCount > 0 && (
                              <span className="absolute -top-2 -right-2 bg-primary text-white font-heading font-black text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-card shadow-md animate-in zoom-in">
                                {inCartCount}
                              </span>
                            )}

                            <div className="flex flex-col text-left">
                              <span className="font-heading font-black text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                {product.ad_tr}
                              </span>
                              {product.aciklama_tr && (
                                <span className="text-[10px] text-foreground/50 line-clamp-2 mt-0.5">
                                  {product.aciklama_tr}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                              <span className="font-heading font-black text-xs sm:text-sm text-primary">
                                ₺{Number(product.fiyat).toFixed(2)}
                              </span>
                              <div className="p-1.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <Plus className="h-3.5 w-3.5" />
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Mobile Floating Cart Summary Bottom Bar (Only on mobile when cart has items) */}
                  {cartItems.length > 0 && !isMobileCartOpen && (
                    <div className="md:hidden absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-card via-card/95 to-card/80 backdrop-blur-md border-t border-border z-10 animate-in slide-in-from-bottom-4 duration-200">
                      <button
                        onClick={() => setIsMobileCartOpen(true)}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-primary hover:bg-primary/95 text-white shadow-xl shadow-primary/25 active:scale-98 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative bg-white/20 p-2 rounded-xl">
                            <ShoppingBag className="h-4 w-4" />
                            <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                              {totalItemCount}
                            </span>
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="font-heading font-black text-xs uppercase tracking-wide">
                              Sepeti Aç ({totalItemCount} Ürün)
                            </span>
                            <span className="text-[10px] opacity-80 font-medium">
                              Siparişi incele ve onayla
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 font-heading font-black text-sm">
                          <span>₺{totalPrice.toFixed(2)}</span>
                          <span className="text-xs font-normal opacity-80">→</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Desktop Right Column: Fixed Cart Sidebar (Hidden on mobile) */}
                <div className="hidden md:flex w-[360px] lg:w-[400px] flex-col bg-card border-l border-border overflow-hidden min-h-0">
                  
                  {/* Cart Header */}
                  <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30 shrink-0">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                      <span className="font-heading font-black text-sm text-foreground">
                        Sipariş Sepeti
                      </span>
                    </div>
                    <span className="text-xs font-black bg-primary/15 text-primary px-2.5 py-0.5 rounded-full border border-primary/25">
                      {totalItemCount} Ürün
                    </span>
                  </div>

                  {/* Cart Items List */}
                  <div className="flex-1 p-3 sm:p-4 overflow-y-auto flex flex-col gap-2.5">
                    {cartItems.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center gap-2 text-foreground/45 my-auto">
                        <ShoppingBag className="h-10 w-10 opacity-30 stroke-[1.5]" />
                        <span className="text-xs font-semibold">Henüz ürün eklenmedi.</span>
                        <span className="text-[10px] max-w-[200px] opacity-75">
                          Sol menüdeki ürünlere tıklayarak siparişe ekleyebilirsiniz.
                        </span>
                      </div>
                    ) : (
                      cartItems.map(item => {
                        const productFiyat = Number(item.product?.fiyat || 0)
                        const currentNote = itemNotes[item.id] || item.not_text || ""
                        const isEditingNote = editingNoteItemId === item.id

                        return (
                          <div
                            key={item.id}
                            className="p-3 rounded-2xl bg-secondary/60 dark:bg-[#1E1812] border border-border flex flex-col gap-2 shadow-xs text-left"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-col">
                                <span className="font-heading font-black text-xs text-foreground">
                                  {item.product?.ad_tr}
                                </span>
                                <span className="text-[10px] text-foreground/50 font-bold">
                                  ₺{productFiyat.toFixed(2)} / adet
                                </span>
                              </div>
                              <span className="font-heading font-black text-xs text-primary whitespace-nowrap">
                                ₺{(productFiyat * item.adet).toFixed(2)}
                              </span>
                            </div>

                            {/* Note field or note trigger */}
                            {isEditingNote ? (
                              <div className="flex items-center gap-1.5 mt-1 animate-in fade-in">
                                <input
                                  type="text"
                                  placeholder="Örn: Acısız, az pişmiş, buzsuz..."
                                  value={currentNote}
                                  onChange={e => handleUpdateNote(item.id, e.target.value)}
                                  className="w-full text-[11px] p-2 rounded-lg bg-card border border-primary/50 text-foreground focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  onClick={() => setEditingNoteItemId(null)}
                                  className="p-1.5 rounded-lg bg-primary text-white text-xs font-bold cursor-pointer"
                                  title="Kaydet"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-[10px]">
                                {currentNote ? (
                                  <span
                                    onClick={() => setEditingNoteItemId(item.id)}
                                    className="text-primary italic font-medium cursor-pointer hover:underline truncate max-w-[200px]"
                                  >
                                    ✍️ {currentNote}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setEditingNoteItemId(item.id)}
                                    className="text-foreground/45 hover:text-primary font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <FileText className="h-3 w-3" />
                                    <span>Not Ekle</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Quantity & Delete Controls */}
                            <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-border/50">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 text-foreground/40 hover:text-destructive transition-colors cursor-pointer"
                                title="Kaldır"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>

                              <div className="flex items-center gap-1.5 bg-card rounded-full p-1 border border-border shadow-xs">
                                <button
                                  onClick={() => handleUpdateAdet(item.id, -1)}
                                  className="h-6 w-6 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-5 text-center font-heading font-black text-xs text-foreground">
                                  {item.adet}
                                </span>
                                <button
                                  onClick={() => handleUpdateAdet(item.id, 1)}
                                  className="h-6 w-6 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Cart Footer Actions */}
                  <div className="p-4 border-t border-border bg-card flex flex-col gap-3 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-foreground/60 font-black">
                        Toplam Tutar
                      </span>
                      <span className="font-heading font-black text-2xl text-primary">
                        ₺{totalPrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Submit CTA */}
                    <button
                      onClick={handleConfirmAndSubmit}
                      disabled={cartItems.length === 0 || isSubmitting}
                      className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-heading font-black text-sm transition-all duration-200 shadow-lg shadow-primary/25 active:scale-98 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>İletiliyor...</span>
                      ) : (
                        <>
                          <Check className="h-4 w-4 stroke-[3]" />
                          <span>Siparişi Onayla & Mutfağa İlet</span>
                        </>
                      )}
                    </button>

                    {/* Clear / Cancel buttons */}
                    {cartItems.length > 0 && (
                      <button
                        onClick={() => setCartItems([])}
                        className="text-xs font-bold text-foreground/50 hover:text-destructive transition-colors py-1 cursor-pointer"
                      >
                        Sepeti Temizle
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile Cart Full-Drawer Overlay (Opens on click) */}
                {isMobileCartOpen && (
                  <div className="md:hidden absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
                    <div className="bg-card text-foreground rounded-t-3xl border-t border-border shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-250">
                      
                      {/* Drawer Top Handle / Close Bar */}
                      <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/40 rounded-t-3xl shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-primary/20 text-primary rounded-xl">
                            <ShoppingBag className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="font-heading font-black text-sm text-foreground">
                              Sipariş Sepeti ({selectedTable.masa_adi || `Masa ${selectedTable.masa_no}`})
                            </span>
                            <span className="text-[10px] text-foreground/60 font-bold uppercase">
                              {totalItemCount} Ürün • Toplam: ₺{totalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsMobileCartOpen(false)}
                          className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-muted text-foreground border border-border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <ChevronDown className="h-4 w-4" />
                          <span>Gizle</span>
                        </button>
                      </div>

                      {/* Scrollable Items in Mobile Drawer */}
                      <div className="p-3.5 overflow-y-auto flex flex-col gap-2.5 max-h-[45vh]">
                        {cartItems.map(item => {
                          const productFiyat = Number(item.product?.fiyat || 0)
                          const currentNote = itemNotes[item.id] || item.not_text || ""
                          const isEditingNote = editingNoteItemId === item.id

                          return (
                            <div
                              key={item.id}
                              className="p-3 rounded-2xl bg-secondary/60 dark:bg-[#1E1812] border border-border flex flex-col gap-2 shadow-xs text-left"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex flex-col">
                                  <span className="font-heading font-black text-xs text-foreground">
                                    {item.product?.ad_tr}
                                  </span>
                                  <span className="text-[10px] text-foreground/50 font-bold">
                                    ₺{productFiyat.toFixed(2)} / adet
                                  </span>
                                </div>
                                <span className="font-heading font-black text-xs text-primary whitespace-nowrap">
                                  ₺{(productFiyat * item.adet).toFixed(2)}
                                </span>
                              </div>

                              {/* Note field or note trigger */}
                              {isEditingNote ? (
                                <div className="flex items-center gap-1.5 mt-1 animate-in fade-in">
                                  <input
                                    type="text"
                                    placeholder="Örn: Acısız, az pişmiş, buzsuz..."
                                    value={currentNote}
                                    onChange={e => handleUpdateNote(item.id, e.target.value)}
                                    className="w-full text-[11px] p-2 rounded-lg bg-card border border-primary/50 text-foreground focus:outline-none"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => setEditingNoteItemId(null)}
                                    className="p-1.5 rounded-lg bg-primary text-white text-xs font-bold cursor-pointer"
                                    title="Kaydet"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-[10px]">
                                  {currentNote ? (
                                    <span
                                      onClick={() => setEditingNoteItemId(item.id)}
                                      className="text-primary italic font-medium cursor-pointer hover:underline truncate max-w-[200px]"
                                    >
                                      ✍️ {currentNote}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => setEditingNoteItemId(item.id)}
                                      className="text-foreground/45 hover:text-primary font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <FileText className="h-3 w-3" />
                                      <span>Not Ekle</span>
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Quantity & Delete Controls */}
                              <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-border/50">
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="p-1 text-foreground/40 hover:text-destructive transition-colors cursor-pointer"
                                  title="Kaldır"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>

                                <div className="flex items-center gap-1.5 bg-card rounded-full p-1 border border-border shadow-xs">
                                  <button
                                    onClick={() => handleUpdateAdet(item.id, -1)}
                                    className="h-6 w-6 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-5 text-center font-heading font-black text-xs text-foreground">
                                    {item.adet}
                                  </span>
                                  <button
                                    onClick={() => handleUpdateAdet(item.id, 1)}
                                    className="h-6 w-6 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Drawer Footer Actions */}
                      <div className="p-4 border-t border-border bg-card flex flex-col gap-2.5 shrink-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase tracking-wider text-foreground/60 font-black">
                            Toplam Tutar
                          </span>
                          <span className="font-heading font-black text-2xl text-primary">
                            ₺{totalPrice.toFixed(2)}
                          </span>
                        </div>

                        {/* Submit CTA */}
                        <button
                          onClick={handleConfirmAndSubmit}
                          disabled={cartItems.length === 0 || isSubmitting}
                          className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-heading font-black text-sm transition-all duration-200 shadow-lg shadow-primary/25 active:scale-98 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <span>İletiliyor...</span>
                          ) : (
                            <>
                              <Check className="h-4 w-4 stroke-[3]" />
                              <span>Siparişi Onayla & Mutfağa İlet</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => setIsMobileCartOpen(false)}
                            className="text-xs font-bold text-foreground/60 hover:text-foreground transition-colors py-1 cursor-pointer"
                          >
                            ← Ürün Eklemeye Devam Et
                          </button>
                          <button
                            onClick={() => {
                              setCartItems([]);
                              setIsMobileCartOpen(false);
                            }}
                            className="text-xs font-bold text-destructive hover:underline transition-colors py-1 cursor-pointer"
                          >
                            Sepeti Temizle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
