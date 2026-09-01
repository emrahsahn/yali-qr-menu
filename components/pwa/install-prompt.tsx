"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Download, Share, Plus, WifiOff, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "yali_pwa_dismissed_at"
const DISMISS_DAYS = 14

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  if (typeof window === "undefined") return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function wasRecentlyDismissed(): boolean {
  if (typeof window === "undefined") return false
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const dismissedAt = Number(raw)
  if (Number.isNaN(dismissedAt)) return false
  return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000
}

/**
 * Müşteri menüsünde "Ana Ekrana Ekle" teşvik banner'ı + çevrimdışı göstergesi.
 * - Android/Chrome: yerel install prompt'u (beforeinstallprompt) yakalanır
 * - iOS Safari: "Paylaş → Ana Ekrana Ekle" talimatı gösterilir
 * - Uygulama zaten kurulysa veya yakın zamanda kapatıldıysa gösterilmez
 */
export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) setIsOffline(!navigator.onLine)
    })

    const goOnline = () => setIsOffline(false)
    const goOffline = () => setIsOffline(true)
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)

    const cleanup = () => {
      active = false
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }

    if (isStandalone() || wasRecentlyDismissed()) {
      return cleanup
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)

    // iOS'ta beforeinstallprompt tetiklenmez; kısa bir gecikmeyle talimat göster
    const iosTimer = window.setTimeout(() => {
      if (isIos() && !isStandalone() && !wasRecentlyDismissed()) {
        setVisible(true)
      }
    }, 4000)

    return () => {
      window.clearTimeout(iosTimer)
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      cleanup()
    }
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {}
  }, [])

  const handleInstall = useCallback(async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === "accepted") {
      setVisible(false)
    }
    setInstallEvent(null)
  }, [installEvent])

  if (isOffline) {
    return (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-full bg-amber-500/95 text-white text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <WifiOff className="h-3.5 w-3.5" />
        Çevrimdışı — menü önbellekten gösteriliyor
      </div>
    )
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm">
      <div className="glass-panel p-4 rounded-3xl border-primary/25 shadow-xl relative flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={dismiss}
          className="absolute -top-2.5 -right-2.5 p-1.5 rounded-full bg-card border border-border text-foreground/50 hover:text-foreground transition-colors cursor-pointer shadow-sm"
          title="Kapat"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary shrink-0">
          <Download className="h-5 w-5" />
        </div>

        {installEvent ? (
          <div className="flex flex-col gap-2 text-left pr-2">
            <span className="font-heading font-black text-sm text-foreground">
              Yalı&apos;yı ana ekrana ekleyin
            </span>
            <span className="text-[11px] text-foreground/60 font-semibold leading-relaxed">
              Bir daha QR aramayın; ikona dokunup menüye doğrudan girin.
            </span>
            <button
              onClick={handleInstall}
              className="mt-1 w-fit px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-wider shadow-sm hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Ana Ekrana Ekle
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1 text-left pr-2">
            <span className="font-heading font-black text-sm text-foreground flex items-center gap-1.5">
              <Share className="h-4 w-4 text-primary" />
              Ana ekrana ekleyin
            </span>
            <span className="text-[11px] text-foreground/60 font-semibold leading-relaxed">
              Safari&apos;de <b>Paylaş</b> düğmesine dokunun, ardından{" "}
              <b>&quot;Ana Ekrana Ekle&quot;</b>&apos;yi seçin. Menü bir sonraki
              açılışta çok daha hızlı yüklenir.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
