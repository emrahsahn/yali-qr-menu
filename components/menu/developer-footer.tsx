"use client"

import React from "react"

// =========================================================================
// ✏️ GELİŞTİRİCİ İLETİŞİM BİLGİLERİNİZİ BU ALANDAN DÜZENLEYEBİLİRSİNİZ:
// =========================================================================
export const DEVELOPER_CONFIG = {
  // Kısa Hizmet / Unvan Tanımı (1. Satır)
  title: "Yazılım & Tasarım",

  // Geliştirici İsmi (2. Satır)
  name: "Emrah SAHIN",

  // LinkedIn Profil URL'niz (3. Satır)
  linkedinUrl: "https://www.linkedin.com/in/emrah-şahin/",
  linkedinLabel: "LinkedIn",

  // Instagram Kullanıcı Adınız (@ olmadan - 3. Satır)
  instagramUsername: "shn__emrah"
}

// Minimal LinkedIn SVG Icon
function LinkedinIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  )
}

// Minimal Instagram SVG Icon
function InstagramIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export function DeveloperFooter() {
  const instagramUrl = `https://instagram.com/${DEVELOPER_CONFIG.instagramUsername}`

  return (
    <footer className="w-full max-w-lg mx-auto px-4 mt-8 mb-6 select-none">
      <div className="flex flex-col items-center justify-center gap-1 text-center pt-6 border-t border-border/40">
        {/* 1. Satır: Title / Unvan */}
        <p className="text-[11px] font-medium text-foreground/50 tracking-wide">
          {DEVELOPER_CONFIG.title}
        </p>

        {/* 2. Satır: İsim */}
        <p className="text-xs font-bold text-foreground/80 tracking-wide">
          {DEVELOPER_CONFIG.name}
        </p>

        {/* 3. Satır: LinkedIn & Instagram Adresleri */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium text-foreground/60 pt-0.5">
          {/* LinkedIn */}
          <a
            href={DEVELOPER_CONFIG.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary hover:underline transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LinkedinIcon className="h-3 w-3 opacity-80 text-[#0A66C2] dark:text-[#70B5F9]" />
            <span>{DEVELOPER_CONFIG.linkedinLabel}</span>
          </a>

          <span className="text-foreground/25">•</span>

          {/* Instagram */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary hover:underline transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <InstagramIcon className="h-3 w-3 opacity-75" />
            <span>@{DEVELOPER_CONFIG.instagramUsername}</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
