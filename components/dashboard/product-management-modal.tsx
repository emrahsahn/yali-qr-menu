"use client"

import React, { useState } from "react"
import { Product, Category, ProductPortion } from "@/lib/types/database"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  Utensils,
  Clock,
  Sparkles,
  Check,
  AlertTriangle,
  Flame,
  Leaf,
  Coffee,
  Snowflake,
  Star,
  Eye,
  EyeOff,
  Upload,
  Camera,
  ImagePlus,
  Smartphone,
  Globe,
  Layers,
  Plus,
  Trash2,
  Wine
} from "lucide-react"

// Curated Gourmet Presets for quick selection
const GOURMET_PRESET_IMAGES = [
  { name: "Kebap & Izgara", url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=60" },
  { name: "Steak / Antrikot", url: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&auto=format&fit=crop&q=60" },
  { name: "Tavuk Yemeği", url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=60" },
  { name: "Somon / Balık", url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&auto=format&fit=crop&q=60" },
  { name: "Humus / Meze", url: "https://images.unsplash.com/photo-1628294895520-73f248f57245?w=600&auto=format&fit=crop&q=60" },
  { name: "Kalamar / Deniz Ürünü", url: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&auto=format&fit=crop&q=60" },
  { name: "Salata", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=60" },
  { name: "Baklava / Tatlı", url: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&auto=format&fit=crop&q=60" },
  { name: "Sufle / Çikolata", url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=60" },
  { name: "Cheesecake", url: "https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=600&auto=format&fit=crop&q=60" },
  { name: "Türk Kahvesi", url: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&auto=format&fit=crop&q=60" },
  { name: "Demleme Çay", url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=60" },
  { name: "Latte / Kahve", url: "https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?w=600&auto=format&fit=crop&q=60" },
  { name: "Limonata / Soğuk", url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=60" },
  { name: "Milkshake / İçecek", url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=60" }
]

const COMMON_ALLERGENS = [
  "Gluten",
  "Laktoz",
  "Balık",
  "Deniz Ürünü",
  "Yumurta",
  "Kuruyemiş / Fıstık",
  "Soya",
  "Susam"
]

interface ProductManagementModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null // null if creating new product
  categories: Category[]
  onSave: (productData: Partial<Product>) => Promise<void>
  onOpenCategoryModal?: () => void
}

export function ProductManagementModal({
  isOpen,
  onClose,
  product,
  categories,
  onSave,
  onOpenCategoryModal
}: ProductManagementModalProps) {
  const [adTr, setAdTr] = useState("")
  const [adEn, setAdEn] = useState("")
  const [aciklamaTr, setAciklamaTr] = useState("")
  const [aciklamaEn, setAciklamaEn] = useState("")
  const [fiyat, setFiyat] = useState<string>("0")
  const [kategoriId, setKategoriId] = useState("")
  const [gorselUrl, setGorselUrl] = useState("")
  const [hazirlamaSuresi, setHazirlamaSuresi] = useState("15 dk")
  const [aktif, setAktif] = useState(true)

  // Multi-Portion / Size / Volume state
  const [porsiyonlar, setPorsiyonlar] = useState<ProductPortion[]>([])

  // Attribute Toggles
  const [vejetaryen, setVejetaryen] = useState(false)
  const [vegan, setVegan] = useState(false)
  const [acili, setAcili] = useState(false)
  const [kafein, setKafein] = useState(false)
  const [soguk, setSoguk] = useState(false)
  const [sefOnerisi, setSefOnerisi] = useState(false)
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<"upload" | "preset" | "url">("upload")

  // Tracks which dialog-open/product combination the form was last synced for.
  const [formSyncKey, setFormSyncKey] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 8 * 1024 * 1024) {
      alert("Lütfen 8 MB'tan küçük bir fotoğraf seçiniz.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setGorselUrl(event.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  // Sync state when modal opens or product changes
  if (isOpen) {
    const syncKey = product ? `edit:${product.id}` : "create:new"
    if (formSyncKey !== syncKey) {
      setFormSyncKey(syncKey)
      if (product) {
        setAdTr(product.ad_tr || "")
        setAdEn(product.ad_en || "")
        setAciklamaTr(product.aciklama_tr || "")
        setAciklamaEn(product.aciklama_en || "")
        setFiyat(String(product.fiyat ?? "0"))
        setKategoriId(product.kategori_id || categories[0]?.id || "")
        setGorselUrl(product.gorsel_url || GOURMET_PRESET_IMAGES[0].url)
        setHazirlamaSuresi(product.ozellikler?.hazirlama_suresi || "15 dk")
        setAktif(product.aktif !== undefined ? product.aktif : true)

        setPorsiyonlar(
          product.porsiyonlar && Array.isArray(product.porsiyonlar)
            ? JSON.parse(JSON.stringify(product.porsiyonlar))
            : []
        )

        setVejetaryen(!!product.ozellikler?.vejetaryen)
        setVegan(!!product.ozellikler?.vegan)
        setAcili(!!product.ozellikler?.acili)
        setKafein(!!product.ozellikler?.kafein)
        setSoguk(!!product.ozellikler?.soğuk || !!product.ozellikler?.soguk)
        setSefOnerisi(!!product.ozellikler?.sef_onerisi)
        setSelectedAllergens(product.ozellikler?.alerjenler || [])
      } else {
        setAdTr("")
        setAdEn("")
        setAciklamaTr("")
        setAciklamaEn("")
        setFiyat("150")
        setKategoriId(categories[0]?.id || "")
        setGorselUrl(GOURMET_PRESET_IMAGES[0].url)
        setHazirlamaSuresi("15 dk")
        setAktif(true)
        setPorsiyonlar([])

        setVejetaryen(false)
        setVegan(false)
        setAcili(false)
        setKafein(false)
        setSoguk(false)
        setSefOnerisi(false)
        setSelectedAllergens([])
      }
    }
  }

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens(prev =>
      prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
    )
  }

  // Portion Presets & Handlers
  const applyPreset = (type: "porsiyon" | "kahve" | "hacim") => {
    const base = parseFloat(fiyat) || 100
    if (type === "porsiyon") {
      setPorsiyonlar([
        { id: "opt-1", ad_tr: "1 Porsiyon", ad_en: "1 Portion", fiyat: base },
        { id: "opt-2", ad_tr: "1.5 Porsiyon", ad_en: "1.5 Portion", fiyat: Math.round(base * 1.4) }
      ])
    } else if (type === "kahve") {
      setPorsiyonlar([
        { id: "opt-1", ad_tr: "Küçük Boy", ad_en: "Small", fiyat: base },
        { id: "opt-2", ad_tr: "Orta Boy", ad_en: "Medium", fiyat: base + 25 },
        { id: "opt-3", ad_tr: "Büyük Boy", ad_en: "Large", fiyat: base + 45 }
      ])
    } else if (type === "hacim") {
      setPorsiyonlar([
        { id: "opt-1", ad_tr: "35 cl", ad_en: "35 cl", fiyat: base },
        { id: "opt-2", ad_tr: "50 cl", ad_en: "50 cl", fiyat: Math.round(base * 1.35) },
        { id: "opt-3", ad_tr: "70 cl", ad_en: "70 cl", fiyat: Math.round(base * 1.8) },
        { id: "opt-4", ad_tr: "100 cl", ad_en: "100 cl", fiyat: Math.round(base * 2.4) }
      ])
    }
  }

  const addCustomPortion = () => {
    const nextNum = porsiyonlar.length + 1
    setPorsiyonlar(prev => [
      ...prev,
      {
        id: "opt-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        ad_tr: `Seçenek ${nextNum}`,
        ad_en: `Option ${nextNum}`,
        fiyat: parseFloat(fiyat) || 0
      }
    ])
  }

  const updatePortion = (id: string, field: keyof ProductPortion, val: string | number) => {
    setPorsiyonlar(prev =>
      prev.map(p => {
        if (p.id !== id) return p
        return {
          ...p,
          [field]: field === "fiyat" ? parseFloat(String(val)) || 0 : val
        }
      })
    )
  }

  const removePortion = (id: string) => {
    setPorsiyonlar(prev => prev.filter(p => p.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adTr.trim()) {
      alert("Lütfen Türkçe Ürün Adı giriniz.")
      return
    }
    if (!kategoriId) {
      alert("Lütfen bir kategori seçiniz.")
      return
    }

    setIsSubmitting(true)
    try {
      const validPortions = porsiyonlar
        .filter(p => p.ad_tr.trim().length > 0)
        .map(p => ({
          id: p.id || ("opt-" + Math.random().toString(36).substring(2, 7)),
          ad_tr: p.ad_tr.trim(),
          ad_en: p.ad_en?.trim() || p.ad_tr.trim(),
          fiyat: Number(p.fiyat) || 0
        }))

      // Base price: if portions defined, use first portion's price
      const basePrice = validPortions.length > 0 ? validPortions[0].fiyat : (parseFloat(fiyat) || 0)

      await onSave({
        ...(product?.id && { id: product.id }),
        kategori_id: kategoriId,
        ad_tr: adTr.trim(),
        ad_en: adEn.trim() || adTr.trim(),
        aciklama_tr: aciklamaTr.trim(),
        aciklama_en: aciklamaEn.trim() || aciklamaTr.trim(),
        fiyat: basePrice,
        porsiyonlar: validPortions.length > 0 ? validPortions : undefined,
        gorsel_url: gorselUrl,
        aktif,
        ozellikler: {
          hazirlama_suresi: hazirlamaSuresi,
          alerjenler: selectedAllergens,
          vejetaryen,
          vegan,
          acili,
          kafein,
          soğuk: soguk,
          sef_onerisi: sefOnerisi
        }
      })
      onClose()
    } catch (error) {
      console.error("Save product error:", error)
      alert("Ürün kaydedilirken bir hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-5xl xl:max-w-6xl p-0 overflow-hidden border-border bg-card text-foreground sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col transition-all duration-300">
        
        {/* Top Header */}
        <DialogHeader className="p-4 sm:p-6 border-b border-border bg-muted/40 text-left flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
              <Utensils className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <DialogTitle className="font-heading font-black text-lg sm:text-xl text-foreground">
                {product ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground/60 font-semibold mt-0.5 hidden sm:block">
                Müşterilerin masalarındaki QR menüde görünecek ürün bilgilerini, porsiyon/boyutlarını ve etiketlerini belirleyin.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAktif(!aktif)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm ${
                aktif
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
              }`}
            >
              {aktif ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span>{aktif ? "Menüde Aktif" : "Menüde Pasif"}</span>
            </button>
          </div>
        </DialogHeader>

        {/* Dynamic Responsive Layout: Form Left (7-8 cols), Smartphone Preview Right (4-5 cols) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* Left Form Column */}
          <div className="lg:col-span-7 xl:col-span-8 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 border-b lg:border-b-0 lg:border-r border-border">
            
            {/* Basic Info Group */}
            <div className="flex flex-col gap-4">
              <span className="text-xs uppercase tracking-wider font-black text-primary flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Temel Ürün Bilgileri
              </span>

              {/* Names TR & EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground/80">Ürün Adı (TR) *</label>
                  <input
                    type="text"
                    required
                    value={adTr}
                    onChange={(e) => setAdTr(e.target.value)}
                    placeholder="Örn: Trüflü Risotto"
                    className="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 sm:py-3 rounded-2xl border border-border bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground/80">Product Name (EN)</label>
                  <input
                    type="text"
                    value={adEn}
                    onChange={(e) => setAdEn(e.target.value)}
                    placeholder="Örn: Truffle Risotto"
                    className="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 sm:py-3 rounded-2xl border border-border bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-foreground/80">Kategori *</label>
                    {onOpenCategoryModal && (
                      <button
                        type="button"
                        onClick={onOpenCategoryModal}
                        className="text-[11px] font-extrabold text-primary hover:underline cursor-pointer"
                      >
                        + Yeni Kategori
                      </button>
                    )}
                  </div>
                  <select
                    required
                    value={kategoriId}
                    onChange={(e) => setKategoriId(e.target.value)}
                    className="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 sm:py-3 rounded-2xl border border-border bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.ad_tr} ({cat.ad_en})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground/80">
                    {porsiyonlar.length > 0 ? "Varsayılan / Başlangıç Fiyatı (₺)" : "Satış Fiyatı (₺) *"}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={fiyat}
                    onChange={(e) => setFiyat(e.target.value)}
                    placeholder="250.00"
                    className="w-full text-xs sm:text-sm font-black text-primary px-3.5 py-2.5 sm:py-3 rounded-2xl border border-border bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Descriptions TR & EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground/80">Açıklama (TR)</label>
                  <textarea
                    rows={2.5}
                    value={aciklamaTr}
                    onChange={(e) => setAciklamaTr(e.target.value)}
                    placeholder="İçindekiler ve sunum detayı..."
                    className="w-full text-xs font-medium p-3 sm:p-3.5 rounded-2xl border border-border bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground/80">Description (EN)</label>
                  <textarea
                    rows={2.5}
                    value={aciklamaEn}
                    onChange={(e) => setAciklamaEn(e.target.value)}
                    placeholder="Ingredients and serving details..."
                    className="w-full text-xs font-medium p-3 sm:p-3.5 rounded-2xl border border-border bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* NEW: Multi-Portion, Size & Volume Management Group */}
            <div className="flex flex-col gap-3 p-4 sm:p-5 rounded-3xl bg-secondary/40 border border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs uppercase tracking-wider font-black text-primary flex items-center gap-1.5">
                    <Layers className="h-4 w-4" /> Porsiyon, Boyut & Hacim Seçenekleri
                  </span>
                  <p className="text-[11px] text-foreground/60 font-semibold mt-0.5">
                    Yemekler için (1 Porsiyon / 1.5 Porsiyon), kahveler için (Küçük / Orta / Büyük) veya içecekler için (50 cl / 70 cl / 100 cl).
                  </p>
                </div>

                {/* Quick Presets Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset("porsiyon")}
                    className="px-2.5 py-1 rounded-xl bg-card hover:bg-muted border border-border text-[10px] font-extrabold text-foreground flex items-center gap-1 transition-all cursor-pointer"
                    title="1 Porsiyon ve 1.5 Porsiyon Ekle"
                  >
                    <Utensils className="h-3 w-3 text-primary" />
                    <span>🍽️ Porsiyon</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset("kahve")}
                    className="px-2.5 py-1 rounded-xl bg-card hover:bg-muted border border-border text-[10px] font-extrabold text-foreground flex items-center gap-1 transition-all cursor-pointer"
                    title="Küçük, Orta, Büyük Boy Ekle"
                  >
                    <Coffee className="h-3 w-3 text-primary" />
                    <span>☕ Boyut</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset("hacim")}
                    className="px-2.5 py-1 rounded-xl bg-card hover:bg-muted border border-border text-[10px] font-extrabold text-foreground flex items-center gap-1 transition-all cursor-pointer"
                    title="35cl, 50cl, 70cl, 100cl Ekle"
                  >
                    <Wine className="h-3 w-3 text-primary" />
                    <span>🍷 Hacim (CL)</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Portions List */}
              {porsiyonlar.length > 0 ? (
                <div className="flex flex-col gap-2 mt-2">
                  {porsiyonlar.map((portion, idx) => (
                    <div
                      key={portion.id || idx}
                      className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl bg-card border border-border shadow-xs"
                    >
                      {/* TR Title */}
                      <div className="col-span-5 sm:col-span-4 flex flex-col gap-0.5">
                        <label className="text-[9px] font-extrabold text-foreground/50 uppercase">İsim (TR)</label>
                        <input
                          type="text"
                          required
                          value={portion.ad_tr}
                          onChange={(e) => updatePortion(portion.id, "ad_tr", e.target.value)}
                          placeholder="Örn: 1.5 Porsiyon"
                          className="w-full text-xs font-bold px-2.5 py-1.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary"
                        />
                      </div>

                      {/* EN Title */}
                      <div className="col-span-4 sm:col-span-4 flex flex-col gap-0.5">
                        <label className="text-[9px] font-extrabold text-foreground/50 uppercase">İsim (EN)</label>
                        <input
                          type="text"
                          value={portion.ad_en || ""}
                          onChange={(e) => updatePortion(portion.id, "ad_en", e.target.value)}
                          placeholder="Örn: 1.5 Portion"
                          className="w-full text-xs font-bold px-2.5 py-1.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary"
                        />
                      </div>

                      {/* Price */}
                      <div className="col-span-2 sm:col-span-3 flex flex-col gap-0.5">
                        <label className="text-[9px] font-extrabold text-foreground/50 uppercase">Fiyat (₺)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          required
                          value={portion.fiyat}
                          onChange={(e) => updatePortion(portion.id, "fiyat", e.target.value)}
                          placeholder="0.00"
                          className="w-full text-xs font-black text-primary px-2.5 py-1.5 rounded-xl border border-border bg-background focus:outline-none focus:border-primary"
                        />
                      </div>

                      {/* Delete Button */}
                      <div className="col-span-1 flex items-center justify-end pt-3">
                        <button
                          type="button"
                          onClick={() => removePortion(portion.id)}
                          className="p-1.5 rounded-xl text-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Seçeneği Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={addCustomPortion}
                      className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ Yeni Seçenek Ekle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPorsiyonlar([])}
                      className="text-[11px] font-bold text-foreground/50 hover:text-destructive transition-colors cursor-pointer"
                    >
                      Tüm Seçenekleri Temizle
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-card/60 border border-dashed border-border mt-1">
                  <span className="text-xs text-foreground/60 font-semibold">
                    Bu ürün için henüz farklı porsiyon veya boyut tanımlanmadı (Tek sabit fiyat uygulanır).
                  </span>
                  <button
                    type="button"
                    onClick={addCustomPortion}
                    className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Porsiyon / Boyut Ekle</span>
                  </button>
                </div>
              )}
            </div>

            {/* Visual & Photo Selection Group */}
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-wider font-black text-primary flex items-center gap-1.5">
                <ImagePlus className="h-4 w-4" /> Ürün Görseli
              </span>

              {/* Tabs: Upload, Presets, URL */}
              <div className="flex gap-2 p-1 bg-muted/60 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "upload" ? "bg-card text-foreground shadow-xs" : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  <Upload className="h-3.5 w-3.5 inline mr-1.5" /> Cihazdan Yükle
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preset")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "preset" ? "bg-card text-foreground shadow-xs" : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 inline mr-1.5" /> Hazır Gurme Fotoğrafları
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("url")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "url" ? "bg-card text-foreground shadow-xs" : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5 inline mr-1.5" /> Bağlantı (URL)
                </button>
              </div>

              {activeTab === "upload" && (
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-border bg-background">
                  <label className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-primary/30 hover:border-primary/60 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer">
                    <Camera className="h-6 w-6 text-primary mb-1.5" />
                    <span className="text-xs font-extrabold text-primary">Fotoğraf Seç veya Sürükle</span>
                    <span className="text-[10px] text-foreground/50 font-medium mt-0.5">PNG, JPG, WEBP (Maks. 8MB)</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}

              {activeTab === "preset" && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                  {GOURMET_PRESET_IMAGES.map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => setGorselUrl(preset.url)}
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        gorselUrl === preset.url ? "border-primary ring-2 ring-primary/30 scale-95" : "border-border hover:border-foreground/30"
                      }`}
                    >
                      <Image src={preset.url} alt={preset.name} fill unoptimized className="object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[9px] font-bold p-1 text-center truncate">
                        {preset.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "url" && (
                <div className="flex flex-col gap-1.5">
                  <input
                    type="url"
                    value={gorselUrl}
                    onChange={(e) => setGorselUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-2xl border border-border bg-background focus:outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>

            {/* Preparation Time & Dietary Badges */}
            <div className="flex flex-col gap-4">
              <span className="text-xs uppercase tracking-wider font-black text-primary flex items-center gap-1.5">
                <Star className="h-4 w-4" /> Özellikler & Etiketler
              </span>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground/80">Hazırlama Süresi</label>
                <div className="flex flex-wrap gap-2">
                  {["5-10 dk", "15 dk", "20 dk", "25 dk", "30+ dk"].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setHazirlamaSuresi(time)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        hazirlamaSuresi === time
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "border-border text-foreground/70 hover:bg-muted"
                      }`}
                    >
                      ⏱️ {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSefOnerisi(!sefOnerisi)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    sefOnerisi ? "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 font-extrabold shadow-xs" : "border-border text-foreground/70 hover:bg-muted"
                  }`}
                >
                  <Star className="h-4 w-4 text-purple-500" />
                  <span className="text-xs">Şefin Önerisi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVejetaryen(!vejetaryen)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    vejetaryen ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-xs" : "border-border text-foreground/70 hover:bg-muted"
                  }`}
                >
                  <Leaf className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs">Vejetaryen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVegan(!vegan)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    vegan ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400 font-extrabold shadow-xs" : "border-border text-foreground/70 hover:bg-muted"
                  }`}
                >
                  <Leaf className="h-4 w-4 text-green-500" />
                  <span className="text-xs">Vegan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAcili(!acili)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    acili ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-extrabold shadow-xs" : "border-border text-foreground/70 hover:bg-muted"
                  }`}
                >
                  <Flame className="h-4 w-4 text-rose-500" />
                  <span className="text-xs">Acılı</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSoguk(!soguk)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    soguk ? "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400 font-extrabold shadow-xs" : "border-border text-foreground/70 hover:bg-muted"
                  }`}
                >
                  <Snowflake className="h-4 w-4 text-sky-500" />
                  <span className="text-xs">Soğuk</span>
                </button>

                <button
                  type="button"
                  onClick={() => setKafein(!kafein)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    kafein ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold shadow-xs" : "border-border text-foreground/70 hover:bg-muted"
                  }`}
                >
                  <Coffee className="h-4 w-4 text-amber-500" />
                  <span className="text-xs">Kafeinli</span>
                </button>
              </div>

              {/* Allergen Multiselect */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Alerjen Bilgileri
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ALLERGENS.map((allergen) => {
                    const isSelected = selectedAllergens.includes(allergen)
                    return (
                      <button
                        key={allergen}
                        type="button"
                        onClick={() => toggleAllergen(allergen)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-extrabold shadow-xs"
                            : "border-border text-foreground/70 hover:bg-muted"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                        {allergen}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* Right Live Device Card Preview Column (Responsive 4-5 cols on Laptop/Desktop) */}
          <div className="lg:col-span-5 xl:col-span-4 p-6 lg:p-8 bg-muted/20 flex flex-col gap-5 items-center justify-start border-t lg:border-t-0">
            
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-foreground/70 flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-primary" /> Müşteri Ekranı Önizlemesi
              </span>
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider">
                {aktif ? "Menüde Aktif" : "Tükendi / Gizli"}
              </Badge>
            </div>

            {/* Smartphone Device Frame Container */}
            <div className="relative w-full max-w-[320px] rounded-[36px] border-4 border-foreground/15 bg-background shadow-2xl p-4 flex flex-col gap-3 transition-all duration-300">
              {/* Top Speaker Bar Mockup */}
              <div className="w-16 h-1 bg-foreground/20 rounded-full mx-auto mb-1" />

              {/* Preview Card Mockup */}
              <div className={`w-full rounded-2xl glass-panel p-3 border shadow-sm transition-all duration-300 ${
                !aktif ? "opacity-40 grayscale" : ""
              }`}>
                {/* Product Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={gorselUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60"}
                    alt={adTr || "Önizleme"}
                    fill
                    unoptimized
                    onError={() => {
                      setGorselUrl("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60")
                    }}
                    className="object-cover"
                  />
                  
                  {/* Badges Overlay */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {porsiyonlar.length > 1 && (
                      <Badge className="bg-primary/90 text-white border-none text-[9px] py-0 px-1.5 font-black">
                        ✨ {porsiyonlar.length} Seçenek
                      </Badge>
                    )}
                    {vejetaryen && (
                      <Badge className="bg-emerald-500/90 text-white border-none text-[10px] py-0 px-2 font-semibold">
                        🌱 Veg
                      </Badge>
                    )}
                    {vegan && (
                      <Badge className="bg-green-600/90 text-white border-none text-[10px] py-0 px-2 font-semibold">
                        🌿 Vegan
                      </Badge>
                    )}
                    {sefOnerisi && (
                      <Badge className="bg-purple-600/90 text-white border-none text-[10px] py-0 px-2 font-semibold">
                        ⭐ Şefin Özel
                      </Badge>
                    )}
                  </div>

                  {/* Prep Time Overlay */}
                  {hazirlamaSuresi && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[10px] py-0.5 px-2 rounded-full backdrop-blur-sm z-10">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>{hazirlamaSuresi}</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="mt-3 flex flex-col flex-1 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-black text-sm leading-tight text-foreground">
                      {adTr || "Ürün Adı"}
                    </h3>
                    <span className="font-heading font-black text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md whitespace-nowrap">
                      {porsiyonlar.length > 1
                        ? `₺${Math.min(...porsiyonlar.map(p => Number(p.fiyat) || 0)).toFixed(2)}'den`
                        : `₺${Number(fiyat || 0).toFixed(2)}`}
                    </span>
                  </div>
                  
                  {aciklamaTr && (
                    <p className="mt-1 text-[11px] text-foreground/60 line-clamp-2 leading-relaxed font-medium">
                      {aciklamaTr}
                    </p>
                  )}

                  {/* Portions preview pill list */}
                  {porsiyonlar.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {porsiyonlar.map((por, idx) => (
                        <span key={idx} className="text-[9px] font-extrabold bg-secondary text-foreground/80 px-2 py-0.5 rounded-md border border-border">
                          {por.ad_tr}: ₺{Number(por.fiyat).toFixed(0)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Allergen hint in preview */}
                  {selectedAllergens.length > 0 && (
                    <span className="mt-2 text-[9px] text-amber-600 font-bold truncate">
                      ⚠️ Alerjen: {selectedAllergens.join(", ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Home Indicator */}
              <div className="w-24 h-1 bg-foreground/20 rounded-full mx-auto mt-2" />
            </div>

            <p className="text-[11px] text-foreground/50 text-center font-semibold italic max-w-xs px-2">
              * Müşteriler masalardaki QR kodu tarattığında bu lezzet tam olarak burada gördüğünüz mobil kartla ve porsiyon seçenekleriyle menüde sergilenecektir.
            </p>
          </div>

          {/* Footer Sticky Action Buttons */}
          <div className="lg:col-span-12 p-4 sm:p-6 border-t border-border bg-muted/40 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 py-5 rounded-2xl font-bold text-xs uppercase cursor-pointer"
            >
              Vazgeç
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-5 rounded-2xl font-heading font-black text-sm bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all cursor-pointer"
            >
              {isSubmitting ? "Kaydediliyor..." : product ? "Değişiklikleri Kaydet" : "Ürünü Menüye Ekle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
