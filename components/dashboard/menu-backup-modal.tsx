"use client"

import React, { useState, useRef } from "react"
import {
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  X,
  Database,
  ArrowRight,
  ShieldCheck,
  HelpCircle
} from "lucide-react"

interface MenuBackupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}

interface ValidationPreview {
  valid: boolean
  stats?: {
    category_count: number
    product_count: number
  }
  errors?: string[]
  warnings?: string[]
}

export function MenuBackupModal({ isOpen, onClose, onSuccess }: MenuBackupModalProps) {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePayload, setFilePayload] = useState<unknown | null>(null)
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [preview, setPreview] = useState<ValidationPreview | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) return null

  // 1. Güncel Menüyü İndir (Export)
  const handleExport = async () => {
    setIsDownloading(true)
    setErrorMessage(null)
    try {
      const res = await fetch("/api/menu/backup", { cache: "no-store" })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Menü yedeği indirilemedi.")
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const now = new Date().toISOString().slice(0, 10)
      a.download = `yali_menu_yedek_${now}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      onSuccess("Menü yedeği başarıyla bilgisayarınıza indirildi.")
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Yedek indirilirken bir hata oluştu.")
    } finally {
      setIsDownloading(false)
    }
  }

  // 2. Örnek Şablonu İndir (Template)
  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch("/api/menu/template", { cache: "no-store" })
      if (!res.ok) throw new Error("Şablon indirilemedi.")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "yali_menu_ornek_sablon.json"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Şablon indirilemedi.")
    }
  }

  // 3. Dosya Seçimi ve Anlık Ön Doğrulama
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setErrorMessage(null)
    setPreview(null)

    try {
      const text = await file.text()
      const json = JSON.parse(text)
      setFilePayload(json)

      // Sunucuda ön doğrulama (Dry-Run)
      const res = await fetch("/api/menu/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: json, dryRun: true })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setPreview({
          valid: false,
          errors: data.errors || ["Dosya doğrulamadan geçemedi."],
          warnings: data.warnings || [],
          stats: data.stats
        })
      } else {
        setPreview({
          valid: true,
          stats: data.stats,
          warnings: data.warnings || []
        })
      }
    } catch (err) {
      setErrorMessage("Yüklenen dosya geçerli bir JSON dosyası değil veya bozuk.")
      setPreview({
        valid: false,
        errors: ["JSON sözdizimi (syntax) hatası. Lütfen geçerli bir .json dosyası seçiniz."]
      })
    }
  }

  // 4. Menüyü İçe Aktar (Import & Restore)
  const handleExecuteImport = async () => {
    if (!filePayload) return
    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const res = await fetch("/api/menu/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: filePayload,
          mode: importMode,
          dryRun: false
        })
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error || (result.errors && result.errors.join("\n")) || "İçe aktarma başarısız oldu.")
      }

      onSuccess(result.message || "Menü başarıyla sisteme aktarıldı.")
      onClose()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Menü aktarımı sırasında bir hata oluştu.")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetImportState = () => {
    setSelectedFile(null)
    setFilePayload(null)
    setPreview(null)
    setErrorMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Menü Yedekleme & Aktarım Sistemi
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Veritabanı göçü, çökme kurtarma ve menü veri transferi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50 p-1.5 mx-6 mt-4 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab("export")
              setErrorMessage(null)
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "export"
                ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            }`}
          >
            <Download className="w-4 h-4" />
            Menüyü İndir (Yedek Al)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("import")
              setErrorMessage(null)
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "import"
                ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            }`}
          >
            <Upload className="w-4 h-4" />
            Dosyadan Yükle (İçe Aktar)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <div className="whitespace-pre-line leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* EXPORT TAB */}
          {activeTab === "export" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-stone-700 dark:text-stone-300 text-sm space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                  Tam Güvenceli Yedekleme
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Bu işlem tüm menüyü (kategoriler, ürünler, porsiyon fiyatları, açıklamalar, görseller, alerjen ve şef önerisi etiketleri) standart <code>.json</code> formatında dışa aktarır. Sistemin çökmesi durumunda veya yeni bir sunucu / veritabanına taşınırken bu dosyayı yüklemeniz yeterlidir.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Güncel Menüyü İndir */}
                <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-colors">
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-stone-900 dark:text-stone-100">Güncel Menü Yedeği</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      Sistemde şu an yayında olan tüm kategori ve ürünleri içeren tam yedek dosyası.
                    </p>
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={isDownloading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 font-semibold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-60"
                  >
                    {isDownloading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Hazırlanıyor...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Yedeği İndir (.json)
                      </>
                    )}
                  </button>
                </div>

                {/* Örnek Boş Şablon İndir */}
                <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-colors">
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-stone-900 dark:text-stone-100">Format Şablonu</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      Sıfırdan menü hazırlamak veya toplu ürün yüklemek için gereken örnek format yapısı.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-sm transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4 text-blue-500" />
                    Şablon İndir (.json)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* IMPORT TAB */}
          {activeTab === "import" && (
            <div className="space-y-5">
              {/* File Dropzone */}
              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-stone-50/50 dark:bg-stone-950/40 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    Menü Yedek Dosyasını (.json) Seçin veya Sürükleyin
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm">
                    Daha önce indirdiğiniz menü yedeğini veya standart şablona uygun hazırlanmış dosyayı seçiniz.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected File Info */}
                  <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                        <FileJson className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate max-w-xs sm:max-w-md">
                          {selectedFile.name}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={resetImportState}
                      className="text-xs font-semibold text-stone-500 hover:text-red-500 dark:text-stone-400 dark:hover:text-red-400 p-2"
                    >
                      Değiştir
                    </button>
                  </div>

                  {/* Validation Preview Card */}
                  {preview && (
                    <div className="space-y-3">
                      {preview.valid ? (
                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" />
                            Format Doğrulandı: Menü Yüklenmeye Hazır
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="p-2.5 rounded-lg bg-white/70 dark:bg-stone-900/70 border border-emerald-200/50 dark:border-emerald-900/30">
                              <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">Tespit Edilen Kategori</div>
                              <div className="text-xl font-bold text-stone-800 dark:text-stone-200">
                                {preview.stats?.category_count || 0}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white/70 dark:bg-stone-900/70 border border-emerald-200/50 dark:border-emerald-900/30">
                              <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">Tespit Edilen Ürün</div>
                              <div className="text-xl font-bold text-stone-800 dark:text-stone-200">
                                {preview.stats?.product_count || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                            Dosyada Format Hataları Tespit Edildi
                          </div>
                          <ul className="text-xs text-red-600 dark:text-red-300 list-disc list-inside space-y-1 pl-1">
                            {preview.errors?.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Warnings if any */}
                      {preview.warnings && preview.warnings.length > 0 && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                          <div className="font-semibold flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5" />
                            Uyarılar ({preview.warnings.length})
                          </div>
                          <ul className="list-disc list-inside space-y-0.5 opacity-90 max-h-24 overflow-y-auto">
                            {preview.warnings.slice(0, 5).map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                            {preview.warnings.length > 5 && (
                              <li>...ve {preview.warnings.length - 5} uyarı daha</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode Selection */}
                  {preview?.valid && (
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        Yükleme Stratejisi
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setImportMode("replace")}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            importMode === "replace"
                              ? "border-amber-500 bg-amber-500/5 text-stone-900 dark:text-stone-100 ring-1 ring-amber-500"
                              : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300"
                          }`}
                        >
                          <div className="font-bold text-xs flex items-center gap-1.5 mb-1 text-amber-600 dark:text-amber-400">
                            Sıfırdan Geri Yükle (Replace)
                          </div>
                          <div className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                            Mevcut tüm menüyü temizler ve bu dosyadaki menüyü sıfırdan kurar. (Yeni veritabanı taşımalarında önerilir)
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setImportMode("merge")}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            importMode === "merge"
                              ? "border-amber-500 bg-amber-500/5 text-stone-900 dark:text-stone-100 ring-1 ring-amber-500"
                              : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300"
                          }`}
                        >
                          <div className="font-bold text-xs flex items-center gap-1.5 mb-1 text-amber-600 dark:text-amber-400">
                            Mevcutla Birleştir (Merge)
                          </div>
                          <div className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                            Mevcut ürünleri silmez. Eşleşenleri günceller, yeni kategorileri ve ürünleri listeye ekler.
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800 text-sm font-semibold transition-colors"
          >
            Kapat
          </button>

          {activeTab === "import" && (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={!preview?.valid || isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-md shadow-amber-600/20 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-95"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sisteme Aktarılıyor...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Menüyü Sisteme Aktar
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
