"use client"

import { useEffect } from "react"

/**
 * Müşteri menü alanı için service worker kaydı (/restaurant/ kapsamı).
 * Yönetim paneli ve diğer route'lar service worker kapsamı dışındadır.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    const register = () => {
      navigator.serviceWorker
        .register("/restaurant/sw.js")
        .catch((err) => console.error("Service worker kaydı başarısız:", err))
    }

    if (document.readyState === "complete") {
      register()
    } else {
      window.addEventListener("load", register, { once: true })
      return () => window.removeEventListener("load", register)
    }
  }, [])

  return null
}
