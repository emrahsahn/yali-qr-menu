"use client"

import React, { useState } from "react"
import { Product, Category } from "@/lib/types/database"
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
  Globe
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

  // Load existing product or set defaults. Adjusting state during render
  // (guarded by a sync key) instead of inside an effect avoids cascading
  // re-renders while keeping the form in sync with the target product.
  if (isOpen) {
    const syncKey = `open:${product ? product.id : "new"}`
    if (formSyncKey !== syncKey) {
      setFormSyncKey(syncKey)
      if (product) {
        setAdTr(product.ad_tr || "")
        setAdEn(product.ad_en || "")
        setAciklamaTr(product.aciklama_tr || "")
        setAciklamaEn(product.aciklama_en || "")
        setFiyat(String(product.fiyat || 0))
        setKategoriId(product.kategori_id || (categories[0]?.id || ""))
        setGorselUrl(product.gorsel_url || "")
        setHazirlamaSuresi(product.ozellikler?.hazirlama_suresi || "15 dk")
        setAktif(product.aktif !== undefined ? product.aktif : true)

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
      await onSave({
        ...(product?.id && { id: product.id }),
        kategori_id: kategoriId,
        ad_tr: adTr.trim(),
        ad_en: adEn.trim() || adTr.trim(),
        aciklama_tr: aciklamaTr.trim(),
        aciklama_en: aciklamaEn.trim() || aciklamaTr.trim(),
        fiyat: parseFloat(fiyat) || 0,
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
                Müşterilerin masalarındaki QR menüde görünecek ürün bilgilerini ve etiketlerini belirleyin.
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
                  <label className="text-xs font-bold text-foreground/80">Satış Fiyatı (₺) *</label>
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
                    placeholder="Ingredients and serving detail..."
                    className="w-full text-xs font-medium p-3 sm:p-3.5 rounded-2xl border border-border bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <hr className="border-border opacity-60" />

            {/* Image Selection Section */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-wider font-black text-primary flex items-center gap-1.5">
                  <Camera className="h-4 w-4" /> Ürün Görseli
                </span>

                {/* Subtabs */}
                <div className="flex items-center gap-1 bg-muted p-1 rounded-2xl border border-border">
                  <button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
                      activeTab === "upload" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Cihazdan Yükle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("preset")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
                      activeTab === "preset" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    <span>📸 Gurme Galeri</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("url")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
                      activeTab === "url" ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Web Linki</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: File Upload */}
              {activeTab === "upload" && (
                <div className="flex flex-col gap-2">
                  <label className="group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="p-3.5 bg-primary/10 text-primary rounded-2xl mb-2 group-hover:scale-110 transition-transform">
                      <ImagePlus className="h-7 w-7" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-foreground">
                      Fotoğraf Yüklemek İçin Tıklayın veya Sürükleyin
                    </span>
                    <span className="text-[11px] text-foreground/50 font-semibold mt-1">
                      JPG, PNG, WEBP veya GIF (Maks. 8 MB)
                    </span>
                  </label>
                </div>
              )}

              {/* Tab 2: Preset Gourmet Gallery */}
              {activeTab === "preset" && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-2 rounded-3xl bg-muted/30 border border-border">
                  {GOURMET_PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setGorselUrl(preset.url)
                      }}
                      className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shadow-sm ${
                        gorselUrl === preset.url ? "border-primary ring-2 ring-primary/30 scale-95" : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                    >
                      <Image src={preset.url} alt={preset.name} fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-1.5 text-[9px] font-bold text-white leading-tight">
                        <span className="truncate">{preset.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Tab 3: Custom URL */}
              {activeTab === "url" && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={gorselUrl}
                    onChange={(e) => setGorselUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 text-xs sm:text-sm font-semibold px-3.5 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
            </div>

            <hr className="border-border opacity-60" />

            {/* Preparation & Dietary Attributes */}
            <div className="flex flex-col gap-4">
              <span className="text-xs uppercase tracking-wider font-black text-primary flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Hazırlama Süresi & Özellik Etiketleri
              </span>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-foreground/80 whitespace-nowrap">Hazırlama Süresi:</label>
                <input
                  type="text"
                  value={hazirlamaSuresi}
                  onChange={(e) => setHazirlamaSuresi(e.target.value)}
                  placeholder="Örn: 15-20 dk"
                  className="w-36 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl border border-border bg-background"
                />
              </div>

              {/* Toggles Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setVejetaryen(!vejetaryen)}
                  className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                    vejetaryen ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : "bg-background border-border text-foreground/60 hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Leaf className="h-4 w-4 text-emerald-500" /> 🌱 Vejetaryen</span>
                  {vejetaryen && <Check className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setVegan(!vegan)}
                  className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                    vegan ? "bg-green-500/15 border-green-500/40 text-green-600 dark:text-green-400" : "bg-background border-border text-foreground/60 hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Leaf className="h-4 w-4 text-green-600" /> 🌿 Vegan</span>
                  {vegan && <Check className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setAcili(!acili)}
                  className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                    acili ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400" : "bg-background border-border text-foreground/60 hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Flame className="h-4 w-4 text-rose-500" /> 🌶️ Acılı</span>
                  {acili && <Check className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setKafein(!kafein)}
                  className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                    kafein ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400" : "bg-background border-border text-foreground/60 hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Coffee className="h-4 w-4 text-amber-600" /> ☕ Kafeinli</span>
                  {kafein && <Check className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSoguk(!soguk)}
                  className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                    soguk ? "bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400" : "bg-background border-border text-foreground/60 hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Snowflake className="h-4 w-4 text-blue-500" /> 🧊 Soğuk</span>
                  {soguk && <Check className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSefOnerisi(!sefOnerisi)}
                  className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                    sefOnerisi ? "bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400" : "bg-background border-border text-foreground/60 hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-purple-500" /> ⭐ Şef Önerisi</span>
                  {sefOnerisi && <Check className="h-4 w-4" />}
                </button>
              </div>

              {/* Allergens selector chips */}
              <div className="flex flex-col gap-2 mt-1">
                <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Alerjen Bilgileri:
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ALLERGENS.map((allergen) => {
                    const isSelected = selectedAllergens.includes(allergen)
                    return (
                      <button
                        key={allergen}
                        type="button"
                        onClick={() => toggleAllergen(allergen)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-sm"
                            : "bg-background text-foreground/60 border-border hover:bg-muted"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}{allergen}
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
                      ₺{Number(fiyat || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  {aciklamaTr && (
                    <p className="mt-1 text-[11px] text-foreground/60 line-clamp-2 leading-relaxed font-medium">
                      {aciklamaTr}
                    </p>
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
              * Müşteriler masalardaki QR kodu tarattığında bu lezzet tam olarak burada gördüğünüz mobil kartla menüde sergilenecektir.
            </p>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-card flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-2xl text-xs font-bold py-5 px-5"
          >
            İptal
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-2xl text-xs sm:text-sm font-heading font-black py-5 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 cursor-pointer"
          >
            {isSubmitting ? "Kaydediliyor..." : product ? "Değişiklikleri Kaydet" : "Ürünü Kaydet ve Yayınla"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
