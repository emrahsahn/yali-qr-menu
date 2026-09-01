"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/lib/context/language-context"
import { UtensilsCrossed, Mail, Phone, MapPin } from "lucide-react"

export function SiteFooter() {
  const { t } = useLanguage()
  const pathname = usePathname()

  // Do not show footer on customer order pages
  if (pathname.includes('/table/')) {
    return null
  }

  return (
    <footer className="w-full border-t border-white/20 dark:border-black/20 glass-panel bg-white/5 dark:bg-black/5 mt-auto transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* About Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            <span className="font-heading font-black text-lg tracking-wider text-primary">YALI</span>
          </div>
          <p className="text-xs text-foreground/60 leading-relaxed font-medium">
            {t('common.aboutText')}
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-3">
          <h3 className="font-heading font-bold text-sm text-foreground/80 uppercase tracking-wider">
            {t('landing.venues.title')}
          </h3>
          <div className="flex flex-col gap-2 text-xs">
            <Link href="/cafe" className="text-foreground/60 hover:text-primary transition-colors font-medium">
              ☕ {t('landing.venues.cafe.name')}
            </Link>
            <Link href="/restaurant" className="text-foreground/60 hover:text-primary transition-colors font-medium">
              🍽️ {t('landing.venues.restaurant.name')}
            </Link>
            <Link href="/club" className="text-foreground/60 hover:text-primary transition-colors font-medium">
              🍸 {t('landing.venues.club.name')}
            </Link>
            <Link href="/seafood" className="text-foreground/60 hover:text-primary transition-colors font-medium">
              🐟 {t('landing.venues.seafood.name')}
            </Link>
          </div>
        </div>

        {/* Contact/Info */}
        <div className="flex flex-col gap-3">
          <h3 className="font-heading font-bold text-sm text-foreground/80 uppercase tracking-wider">
            {t('common.contact')}
          </h3>
          <div className="flex flex-col gap-2.5 text-xs text-foreground/60 font-medium">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Yalı Sahil Yolu No: 12, İstanbul</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary flex-shrink-0" />
              <span>+90 (212) 555 1234</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary flex-shrink-0" />
              <span>info@yalisahil.com</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Link href="#" className="hover:text-primary transition-colors" aria-label="Instagram">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </Link>
              <Link href="#" className="hover:text-primary transition-colors" aria-label="Facebook">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Copyright row */}
      {/* suppressHydrationWarning: the year is computed at render time and may
          differ between server and client across New Year's midnight */}
      <div
        suppressHydrationWarning
        className="w-full border-t border-white/10 dark:border-black/10 py-4 text-center text-[10px] text-foreground/40 font-bold uppercase tracking-widest"
      >
        © {new Date().getFullYear()} YALI PORTAL — ALL RIGHTS RESERVED
      </div>
    </footer>
  )
}
