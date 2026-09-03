"use client"

import React, { useState } from "react"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"
import {
  Printer,
  Download,
  Settings2,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface TableQrCardPrinterProps {
  baseMenuUrl: string
}

export function TableQrCardPrinter({ baseMenuUrl }: TableQrCardPrinterProps) {
  // Config state
  const [tableCount, setTableCount] = useState<number>(10)
  const [startNumber, setStartNumber] = useState<number>(1)
  const [prefix, setPrefix] = useState<string>("M-")
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0)
  const [isExporting, setIsExporting] = useState<boolean>(false)

  // Generate table list (All point strictly to the common menu URL)
  const tables = Array.from({ length: Math.max(1, Math.min(tableCount, 100)) }, (_, i) => {
    const num = startNumber + i
    const formattedNum = num < 10 ? `0${num}` : `${num}`
    const label = `${prefix}${formattedNum}`
    const url = baseMenuUrl.includes("?") ? `${baseMenuUrl}&qr=yali` : `${baseMenuUrl}?qr=yali`
    return { num, formattedNum, label, url }
  })

  // Selected table for single preview
  const currentTable = tables[Math.min(currentPreviewIndex, tables.length - 1)] || tables[0]

  // Print function using browser print window
  const handlePrint = () => {
    window.print()
  }

  // Download high-resolution PNG of a single card using Canvas (7.5x10 cm @ 300 DPI)
  const downloadSingleCardPng = async (tableItem: typeof currentTable) => {
    try {
      setIsExporting(true)
      const canvas = document.createElement("canvas")
      // 75mm x 100mm at 300 DPI (approx 886 x 1181 px)
      const width = 886
      const height = 1181
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // 1. Background White
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, width, height)

      // 2. Load and draw Logo (Top)
      const logoImg = new window.Image()
      logoImg.crossOrigin = "anonymous"
      await new Promise((resolve) => {
        logoImg.onload = resolve
        logoImg.onerror = resolve
        logoImg.src = "/logo.png"
      })

      if (logoImg.width > 0) {
        const logoHeight = 220
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight
        const logoX = (width - logoWidth) / 2
        ctx.drawImage(logoImg, logoX, 50, logoWidth, logoHeight)
      }

      // 3. Generate QR Code image (5x5 cm -> 590x590 px)
      const qrSvgElement = document.getElementById(`qr-svg-${tableItem.num}`)
      if (qrSvgElement) {
        const svgData = new XMLSerializer().serializeToString(qrSvgElement)
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
        const URL = window.URL || window.webkitURL || window
        const blobURL = URL.createObjectURL(svgBlob)

        const qrImg = new window.Image()
        await new Promise((resolve) => {
          qrImg.onload = resolve
          qrImg.onerror = resolve
          qrImg.src = blobURL
        })

        // QR is 50mm x 50mm -> 590 x 590 px @ 300 DPI
        const qrSize = 590
        const qrX = (width - qrSize) / 2
        const qrY = 320
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
        URL.revokeObjectURL(blobURL)
      }

      // 4. Draw Table Number (Bottom) e.g. "M-01"
      ctx.fillStyle = "#000000"
      ctx.font = "900 130px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(tableItem.label, width / 2, 1030)

      // 5. Download image
      const dataUrl = canvas.toDataURL("image/png", 1.0)
      const link = document.createElement("a")
      link.download = `Yali-Masa-Karti-${tableItem.label}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error("Single card PNG export failed:", e)
    } finally {
      setIsExporting(false)
    }
  }

  // Download all cards sequentially
  const downloadAllCardsPng = async () => {
    setIsExporting(true)
    for (const table of tables) {
      await downloadSingleCardPng(table)
      // Small pause between downloads to prevent browser blocking
      await new Promise((r) => setTimeout(r, 250))
    }
    setIsExporting(false)
  }

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Configuration Controls Bar */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
            <Settings2 className="h-4 w-4" />
            7.5 × 10 CM MASA BASKI ŞABLONU
          </div>
          <h3 className="font-heading font-black text-xl text-foreground">
            Restoran Masa Kartı & QR Üretici
          </h3>
          <p className="text-xs text-foreground/60">
            Tüm masalar ortak dijital menüyü açar. Kartlar 7.5 × 10 cm ve QR 5 × 5 cm ebadındadır.
          </p>
        </div>

        {/* Inputs */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-foreground/60 tracking-wider">
              Masa Ön Eki
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="M-"
              className="w-20 px-3 py-2 rounded-xl bg-secondary border border-border text-xs font-black text-foreground text-center focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-foreground/60 tracking-wider">
              Başlangıç No
            </label>
            <input
              type="number"
              min={1}
              max={999}
              value={startNumber}
              onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 px-3 py-2 rounded-xl bg-secondary border border-border text-xs font-black text-foreground text-center focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-foreground/60 tracking-wider">
              Masa Sayısı
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={tableCount}
              onChange={(e) => setTableCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-24 px-3 py-2 rounded-xl bg-secondary border border-border text-xs font-black text-foreground text-center focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Main Preview and Actions Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 7.5cm x 10cm Card Mockup Simulator */}
        <div className="lg:col-span-5 flex flex-col items-center gap-4">
          <div className="flex items-center justify-between w-full max-w-[280px] px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Canlı Önizleme ({currentPreviewIndex + 1}/{tables.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPreviewIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentPreviewIndex === 0}
                className="p-1.5 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPreviewIndex((prev) => Math.min(tables.length - 1, prev + 1))}
                disabled={currentPreviewIndex === tables.length - 1}
                className="p-1.5 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* PHYSICAL 7.5cm x 10cm RATIO CARD SIMULATOR */}
          <div className="relative p-1 rounded-3xl bg-gradient-to-b from-border/80 to-border/30 shadow-2xl">
            <div
              className="w-[280px] h-[373px] bg-white text-black rounded-2xl shadow-xl flex flex-col items-center justify-between p-4 border border-black/10 relative overflow-hidden select-none"
              style={{
                aspectRatio: "75 / 100"
              }}
            >
              {/* Card Dimensions Label (Visual helper) */}
              <div className="absolute top-1.5 right-2 text-[8px] font-black text-black/30 tracking-widest uppercase">
                7.5 × 10 CM
              </div>

              {/* 1. Header Logo (Yalı Day & Night) */}
              <div className="w-full flex flex-col items-center justify-center pt-2">
                <div className="relative w-36 h-14">
                  <Image
                    src="/logo.png"
                    alt="Yalı Day & Night"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              </div>

              {/* 2. Middle: 5x5 cm QR Code */}
              <div className="p-1.5 bg-white rounded-xl border border-black/5 shadow-xs flex flex-col items-center">
                <QRCodeSVG
                  value={currentTable.url}
                  size={145}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* 3. Bottom: Table Number e.g. M-01 */}
              <div className="w-full text-center pb-2">
                <span className="font-sans font-black text-3xl sm:text-4xl text-black tracking-wider leading-none">
                  {currentTable.label}
                </span>
              </div>
            </div>
          </div>

          <span className="text-[11px] text-foreground/50 text-center font-medium">
            * 7.5 cm × 10 cm standart masa stantları ve pleksiler için uygundur.
          </span>
        </div>

        {/* Right: Batch Actions & Table Grid */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Main Action Buttons */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-md flex flex-col gap-4">
            <h4 className="font-heading font-black text-lg text-foreground flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              Yazdırma & İndirme Seçenekleri
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Print / Save to PDF (All Tables A4 layout) */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/25 transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Tüm Masaları Yazdır (A4 / PDF)</span>
              </button>

              {/* 2. Download Selected Table PNG */}
              <button
                type="button"
                onClick={() => downloadSingleCardPng(currentTable)}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <Download className="h-4 w-4 text-primary" />
                <span>Seçili Kartı İndir ({currentTable.label})</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-foreground/60 font-semibold">
                Toplam <strong>{tables.length}</strong> masa kartı hazırlandı ({tables[0]?.label} — {tables[tables.length - 1]?.label}).
              </span>
              <button
                type="button"
                onClick={downloadAllCardsPng}
                disabled={isExporting}
                className="text-xs font-black text-primary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Tümünü Tek Tek PNG İndir</span>
              </button>
            </div>
          </div>

          {/* Quick Table Switcher Grid */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-md flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" />
                Tüm Masa Kartları ({tables.length} Adet)
              </span>
              <span className="text-[11px] text-foreground/50 font-medium">
                Önizlemek için masaya tıklayın
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1">
              {tables.map((table, idx) => (
                <button
                  key={table.num}
                  type="button"
                  onClick={() => setCurrentPreviewIndex(idx)}
                  className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                    currentPreviewIndex === idx
                      ? "bg-primary text-white border-primary shadow-md scale-105"
                      : "bg-secondary hover:bg-muted text-foreground border-border"
                  }`}
                >
                  {table.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HIDDEN PRINT CONTAINER (Rendered ONLY during window.print() on A4 paper) */}
      {/* ========================================================================= */}
      <div className="hidden print:block print:w-full print:bg-white print:text-black">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body * {
              visibility: hidden;
            }
            #yali-print-area, #yali-print-area * {
              visibility: visible;
            }
            #yali-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 190mm;
              display: grid !important;
              grid-template-columns: 75mm 75mm;
              gap: 15mm 15mm;
              justify-content: center;
              background: white !important;
            }
            .yali-card-page-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}} />

        <div id="yali-print-area">
          {tables.map((table) => (
            <div
              key={table.num}
              className="yali-card-page-break"
              style={{
                width: "75mm",
                height: "100mm",
                boxSizing: "border-box",
                border: "1px solid #E2E8F0",
                borderRadius: "3mm",
                padding: "5mm 4mm",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#FFFFFF",
                position: "relative"
              }}
            >
              {/* 1. Header Logo */}
              <div style={{ width: "100%", display: "flex", justifyContent: "center", height: "18mm" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Yalı Day & Night"
                  style={{ maxHeight: "18mm", maxWidth: "48mm", objectFit: "contain" }}
                />
              </div>

              {/* 2. Middle: Exact 50mm x 50mm QR Code (Common Menu URL) */}
              <div
                style={{
                  width: "50mm",
                  height: "50mm",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FFFFFF"
                }}
              >
                <QRCodeSVG
                  id={`qr-svg-${table.num}`}
                  value={table.url}
                  size={188} // 50mm @ 96dpi ≈ 188px
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* 3. Bottom: Table Label e.g. M-01 */}
              <div style={{ width: "100%", textAlign: "center", height: "12mm", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span
                  style={{
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    fontWeight: 900,
                    fontSize: "26pt",
                    color: "#000000",
                    letterSpacing: "1px",
                    lineHeight: 1
                  }}
                >
                  {table.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
