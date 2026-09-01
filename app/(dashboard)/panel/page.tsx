"use client"

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { Product, Category } from "@/lib/types/database"
import { ProductManagementModal } from "@/components/dashboard/product-management-modal"
import { CategoryManagementModal } from "@/components/dashboard/category-management-modal"
import { QRCodeCanvas } from "qrcode.react"
import Image from "next/image"
import Link from "next/link"
import {
  Utensils,
  Plus,
  Layers,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Clock,
  Sparkles,
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  Moon,
  Sun
} from "lucide-react"
import { useTheme } from "next-themes"

// Static subscription helper for origin
const subscribeToNothing = (_onChange: () => void) => () => {}

export default function StaffPanelPage() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const [activeTab, setActiveTab] = useState<"menu" | "qr">("menu")

  // Menu data
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  // QR & Copy states
  const [copied, setCopied] = useState(false)
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Get current origin safely
  const origin = useSyncExternalStore(
    subscribeToNothing,
    () => (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
    () => "http://localhost:3000"
  )

  const menuUrl = `${origin}/menu`

  // Fetch Menu Data from server API
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products?include_inactive=true", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" })
      ])

      if (prodRes.ok && catRes.ok) {
        const prodData = await prodRes.json()
        const catData = await catRes.json()

        if (prodData.products && Array.isArray(prodData.products)) {
          setProducts(prodData.products)
        }
        if (catData.categories && Array.isArray(catData.categories)) {
          setCategories(catData.categories)
        }
      }
    } catch (err) {
      console.error("Panel data fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) fetchData()
    })
    return () => {
      active = false
    }
  }, [fetchData])

  // Quick Toggle Active (Tükendi / Stokta)
  const handleToggleActive = async (product: Product) => {
    try {
      // Optimistic update
      const updatedList = products.map((p) =>
        p.id === product.id ? { ...p, aktif: !p.aktif } : p
      )
      setProducts(updatedList)

      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id })
      })

      if (res.ok) {
        showToast(
          product.aktif
            ? `"${product.ad_tr}" TÜKENDİ olarak işaretlendi.`
            : `"${product.ad_tr}" tekrar STOKTA olarak işaretlendi.`
        )
        // Broadcast event to other tabs
        try {
          const bc = new BroadcastChannel("yali_menu_events")
          bc.postMessage({ type: "MENU_UPDATED" })
          bc.close()
          window.dispatchEvent(new Event("yali_menu_updated"))
        } catch {}
      } else {
        await fetchData()
      }
    } catch {
      await fetchData()
    }
  }

  // Save Product (Create or Edit)
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const isEdit = !!productData.id
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch("/api/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData)
      })

      if (res.ok) {
        showToast(isEdit ? "Ürün başarıyla güncellendi." : "Yeni ürün başarıyla eklendi.")
        setIsProductModalOpen(false)
        setSelectedProduct(null)
        await fetchData()

        try {
          const bc = new BroadcastChannel("yali_menu_events")
          bc.postMessage({ type: "MENU_UPDATED" })
          bc.close()
          window.dispatchEvent(new Event("yali_menu_updated"))
        } catch {}
      } else {
        const err = await res.json()
        alert(err.error || "Ürün kaydedilirken bir hata oluştu.")
      }
    } catch {
      alert("Sunucu bağlantı hatası oluştu.")
    }
  }

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`"${name}" ürününü menüden silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE"
      })

      if (res.ok) {
        showToast(`"${name}" menüden silindi.`)
        setProducts((prev) => prev.filter((p) => p.id !== id))
        try {
          const bc = new BroadcastChannel("yali_menu_events")
          bc.postMessage({ type: "MENU_UPDATED" })
          bc.close()
          window.dispatchEvent(new Event("yali_menu_updated"))
        } catch {}
      } else {
        alert("Ürün silinemedi.")
      }
    } catch {
      alert("Silme işlemi sırasında hata oluştu.")
    }
  }

  // Category Handlers
  const handleAddCategory = async (adTr: string, adEn: string, sira: number) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad_tr: adTr, ad_en: adEn, sira })
      })
      if (res.ok) {
        showToast("Kategori başarıyla eklendi.")
        await fetchData()
      } else {
        alert("Kategori eklenemedi.")
      }
    } catch {
      alert("Kategori ekleme sırasında hata oluştu.")
    }
  }

  const handleUpdateCategory = async (id: string, adTr: string, adEn: string, sira: number) => {
    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ad_tr: adTr, ad_en: adEn, sira })
      })
      if (res.ok) {
        showToast("Kategori güncellendi.")
        await fetchData()
      } else {
        alert("Kategori güncellenemedi.")
      }
    } catch {
      alert("Kategori güncelleme sırasında hata oluştu.")
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        showToast("Kategori silindi.")
        await fetchData()
      } else {
        alert("Kategori silinemedi.")
      }
    } catch {
      alert("Kategori silme sırasında hata oluştu.")
    }
  }

  // Copy Menu URL
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(menuUrl)
      setCopied(true)
      showToast("Müşteri menü linki panoya kopyalandı!")
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Download QR as PNG
  const handleDownloadQrPng = () => {
    const canvas = qrCanvasRef.current || document.getElementById("yali-qr-canvas") as HTMLCanvasElement
    if (!canvas) {
      alert("QR Kod yüklenemedi.")
      return
    }

    const pngUrl = canvas.toDataURL("image/png")
    const downloadLink = document.createElement("a")
    downloadLink.href = pngUrl
    downloadLink.download = "Yali_Restaurant_QR_Menu.png"
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    showToast("QR Kod görseli başarıyla indirildi.")
  }

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "all" || p.kategori_id === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      p.ad_tr.toLowerCase().includes(q) ||
      (p.ad_en && p.ad_en.toLowerCase().includes(q)) ||
      (p.aciklama_tr && p.aciklama_tr.toLowerCase().includes(q))
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.aktif !== false) ||
      (statusFilter === "inactive" && p.aktif === false)

    return matchesCat && matchesSearch && matchesStatus
  })

  const activeCount = products.filter((p) => p.aktif !== false).length
  const outOfStockCount = products.filter((p) => p.aktif === false).length

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border border-primary/40 text-foreground px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Utensils className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-lg sm:text-xl tracking-wide text-foreground">
                  YALI RESTAURANT
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-black uppercase tracking-wider">
                  GÖREVLİ PANELİ
                </span>
              </div>
              <p className="text-[11px] text-foreground/50 font-semibold">
                QR Menü & İçerik Yönetim Sistemi
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* Live Preview Button */}
            <Link
              href="/menu"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5 text-primary" />
              <span>Menüyü Önizle</span>
            </Link>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground/70 hover:text-foreground cursor-pointer transition-all"
              title="Tema Değiştir"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive text-xs font-bold transition-all cursor-pointer"
              title="Çıkış Yap"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Çıkış</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 pt-1 border-t border-border/50">
          <button
            type="button"
            onClick={() => setActiveTab("menu")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "menu"
                ? "border-primary text-primary"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Menü & Ürün Yönetimi</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] text-foreground/70">
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("qr")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "qr"
                ? "border-primary text-primary"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>QR Kod & Menü Bağlantısı</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 flex-1 flex flex-col">
        
        {/* TAB 1: MENU & PRODUCT MANAGEMENT */}
        {activeTab === "menu" && (
          <div className="flex flex-col gap-6">
            
            {/* Action Bar & Quick Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 p-5 rounded-3xl border border-border">
              {/* Stats & Quick overview */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary border border-border font-semibold">
                  <span>Toplam Ürün:</span>
                  <strong className="text-foreground">{products.length}</strong>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Aktif (Stokta):</span>
                  <strong>{activeCount}</strong>
                </div>
                {outOfStockCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-semibold animate-pulse">
                    <span>Tükendi:</span>
                    <strong>{outOfStockCount}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground transition-all cursor-pointer"
                >
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Kategorileri Yönet</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null)
                    setIsProductModalOpen(true)
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Yeni Ürün Ekle</span>
                </button>
              </div>
            </div>

            {/* Search & Category Filter Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <input
                  type="text"
                  placeholder="Yemek adı, içerik veya açıklama ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-border text-xs sm:text-sm font-medium focus:outline-none focus:border-primary/60 transition-colors"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-card p-1 rounded-2xl border border-border">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === "all" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  Tümü ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === "active" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  Stokta ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("inactive")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === "inactive" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  Tükendi ({outOfStockCount})
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedCategory === "all"
                    ? "bg-primary/15 border-primary text-primary"
                    : "bg-card border-border text-foreground/70 hover:text-foreground"
                }`}
              >
                Tüm Kategoriler
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategory === cat.id
                      ? "bg-primary/15 border-primary text-primary"
                      : "bg-card border-border text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {cat.ad_tr}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-foreground/50">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs font-semibold">Menü ürünleri yükleniyor...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 rounded-3xl bg-card border border-border flex flex-col items-center justify-center text-center gap-3">
                <Utensils className="h-8 w-8 text-foreground/40" />
                <h3 className="font-bold text-base">Aradığınız kriterde ürün bulunamadı</h3>
                <p className="text-xs text-foreground/60 max-w-sm">
                  Farklı bir arama terimi deneyebilir veya &quot;Yeni Ürün Ekle&quot; butonu ile yeni bir yemek ekleyebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => {
                  const isSoldOut = !product.aktif
                  const categoryName = categories.find((c) => c.id === product.kategori_id)?.ad_tr || "Kategori"

                  return (
                    <div
                      key={product.id}
                      className={`relative flex flex-col rounded-3xl border bg-card p-4 transition-all duration-300 shadow-sm hover:shadow-md ${
                        isSoldOut ? "border-destructive/30 bg-card/60 opacity-80" : "border-border"
                      }`}
                    >
                      {/* Top Row: Image & Info */}
                      <div className="flex gap-3.5">
                        <div className="relative h-24 w-24 flex-shrink-0 rounded-2xl overflow-hidden bg-muted">
                          <Image
                            src={product.gorsel_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60"}
                            alt={product.ad_tr}
                            fill
                            unoptimized
                            className={`object-cover ${isSoldOut ? "grayscale-[50%]" : ""}`}
                          />
                          {isSoldOut && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                              <span className="bg-destructive text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                TÜKENDİ
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title, Category & Price */}
                        <div className="flex-1 flex flex-col min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider truncate">
                              {categoryName}
                            </span>
                            <span className="font-heading font-black text-sm text-primary">
                              ₺{Number(product.fiyat).toFixed(2)}
                            </span>
                          </div>

                          <h3 className="font-heading font-bold text-sm text-foreground truncate mt-0.5">
                            {product.ad_tr}
                          </h3>

                          {product.aciklama_tr && (
                            <p className="text-[11px] text-foreground/60 line-clamp-2 mt-1 font-medium leading-snug">
                              {product.aciklama_tr}
                            </p>
                          )}

                          {/* Quick Badges */}
                          <div className="flex flex-wrap gap-1 mt-auto pt-2">
                            {product.ozellikler?.sef_onerisi && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                ⭐ Şefin Özel
                              </span>
                            )}
                            {product.ozellikler?.vejetaryen && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                🌱 Veg
                              </span>
                            )}
                            {product.ozellikler?.acili && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400">
                                🌶️ Acılı
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px w-full bg-border my-3" />

                      {/* Bottom Controls */}
                      <div className="flex items-center justify-between gap-2">
                        {/* 1-Click Tükendi Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(product)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                            product.aktif
                              ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              : "bg-destructive/15 hover:bg-destructive/25 border-destructive/40 text-destructive"
                          }`}
                        >
                          {product.aktif ? (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              <span>Stokta (Aktif)</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5" />
                              <span>Tükendi Yapıldı</span>
                            </>
                          )}
                        </button>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(product)
                              setIsProductModalOpen(true)
                            }}
                            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground/80 hover:text-foreground transition-all cursor-pointer"
                            title="Düzenle"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id, product.ad_tr)}
                            className="p-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QR CODE & MENU LINK GENERATOR */}
        {activeTab === "qr" && (
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
            <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              {/* Title */}
              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-3">
                <QrCode className="h-7 w-7" />
              </div>
              <h2 className="font-heading font-black text-2xl text-foreground">
                Yalı Restaurant Müşteri QR Kodu
              </h2>
              <p className="text-xs text-foreground/60 max-w-md mt-1 font-medium">
                Masalara, menü kartlarına ve stantlara basılacak tekil ortak dijital QR menü bağlantısı.
              </p>

              {/* Live QR Code Box */}
              <div className="mt-8 p-6 rounded-3xl bg-white text-black shadow-2xl border border-border flex flex-col items-center gap-3 relative">
                <div className="flex items-center gap-1.5 text-xs font-black tracking-widest text-[#B98A4A] uppercase mb-1">
                  <Sparkles className="h-4 w-4" />
                  YALI RESTAURANT
                </div>

                <QRCodeCanvas
                  id="yali-qr-canvas"
                  ref={qrCanvasRef}
                  value={menuUrl}
                  size={240}
                  level="H"
                  includeMargin={false}
                />

                <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest mt-1">
                  MENÜYÜ GÖRMEK İÇİN OKUTUNUZ
                </span>
              </div>

              {/* URL Display & Copy */}
              <div className="w-full max-w-lg mt-8 flex flex-col gap-2 text-left">
                <label className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider px-1">
                  Müşteri Menü Bağlantısı:
                </label>
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-secondary border border-border">
                  <span className="flex-1 text-xs font-mono font-semibold px-2 text-foreground truncate">
                    {menuUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Kopyalandı!" : "Kopyala"}</span>
                  </button>
                </div>
              </div>

              {/* Action Download Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleDownloadQrPng}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>QR Kodu PNG Olarak İndir</span>
                </button>

                <Link
                  href="/menu"
                  target="_blank"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border font-bold text-xs uppercase tracking-wider text-foreground transition-all"
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <span>Menüyü Yeni Sekmede Aç</span>
                </Link>
              </div>

              {/* Printing Tips */}
              <div className="mt-8 p-4 rounded-2xl bg-secondary/50 border border-border text-left w-full max-w-lg flex flex-col gap-1.5 text-xs text-foreground/70">
                <span className="font-black text-foreground flex items-center gap-1.5">
                  💡 Baskı ve Masa Tavsiyesi:
                </span>
                <p className="text-[11px] leading-relaxed">
                  İndirdiğiniz PNG dosyasını masa numarası gerektirmeksizin tüm restoran masalarına, pleksi stantlara veya giriş tabelalarına doğrudan bastırabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Product Management Modal */}
      <ProductManagementModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
        categories={categories}
        onSave={handleSaveProduct}
        onOpenCategoryModal={() => {
          setIsProductModalOpen(false)
          setIsCategoryModalOpen(true)
        }}
      />

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  )
}
