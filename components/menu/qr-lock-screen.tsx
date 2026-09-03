"use client"

import React from "react"
import { YaliLogo } from "@/components/ui/yali-logo"
import { QrCode, Sparkles, ShieldCheck, Camera, Smartphone } from "lucide-react"

export function QrLockScreen() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative bg-gradient-to-br from-[#17140F] via-[#1F1B14] to-black text-white selection:bg-[#B98A4A]/30 overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#B98A4A]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#B98A4A]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center text-center">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <YaliLogo size="lg" shadow className="rounded-3xl border-[#B98A4A]/40 shadow-[0_0_40px_rgba(185,138,74,0.25)]" />

          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-[#B98A4A] flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              DAY & NIGHT · GOURMET
            </span>
            <h1 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-widest leading-none">
              YALI RESTAURANT
            </h1>
          </div>
        </div>

        {/* Lock Notice Card */}
        <div className="w-full bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-6">
          <div className="p-3.5 rounded-2xl bg-[#B98A4A]/15 border border-[#B98A4A]/30 text-[#B98A4A] animate-pulse">
            <QrCode className="h-8 w-8" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#B98A4A]">
              MASA DOĞRULAMASI GEREKLİDİR
            </h2>
            <p className="text-sm sm:text-base font-medium text-white/90 leading-relaxed">
              &ldquo;Değerli misafirimiz, menümüz sadece masalarımızdaki QR kod ile görüntülenebilmektedir.&rdquo;
            </p>
          </div>

          {/* How to open instructions */}
          <div className="w-full bg-black/30 p-4 rounded-2xl border border-white/5 flex flex-col gap-2.5 text-left text-xs text-white/80">
            <div className="flex items-center gap-2.5 text-white/90 font-bold">
              <Camera className="h-4 w-4 text-[#B98A4A] shrink-0" />
              <span>1. Telefonunuzun kamerasını açın</span>
            </div>
            <div className="flex items-center gap-2.5 text-white/90 font-bold">
              <QrCode className="h-4 w-4 text-[#B98A4A] shrink-0" />
              <span>2. Masanızdaki QR kodu okutun</span>
            </div>
            <div className="flex items-center gap-2.5 text-white/90 font-bold">
              <Smartphone className="h-4 w-4 text-[#B98A4A] shrink-0" />
              <span>3. Bildirimden menümüze göz atın</span>
            </div>
          </div>

          {/* 2-Hour Info Badge */}
          <div className="flex items-center gap-2 text-[11px] text-[#B98A4A] font-semibold bg-[#B98A4A]/10 px-3.5 py-2 rounded-xl border border-[#B98A4A]/20">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Masanızdaki QR okutulduğunda oturum açar.</span>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-[11px] text-white/40 font-medium tracking-wide">
          © {new Date().getFullYear()} Yalı Restaurant & Lounge. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  )
}
