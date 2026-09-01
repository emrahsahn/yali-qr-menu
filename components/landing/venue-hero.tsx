"use client"

import React from "react"
import Link from "next/link"
import { useLanguage } from "@/lib/context/language-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface VenueHeroProps {
  title: string
  tagline: string
  emoji: string
  accentColor: string
}

export function VenueHero({
  title,
  tagline,
  emoji,
  accentColor
}: VenueHeroProps) {
  const { t } = useLanguage()

  return (
    <section className="relative w-full py-16 px-4 overflow-hidden rounded-b-[2.5rem] border-b border-white/20 dark:border-black/20 shadow-md">
      {/* Dynamic gradient background */}
      <div 
        className="absolute inset-0 opacity-10 dark:opacity-20 transition-all duration-500"
        style={{
          background: `radial-gradient(circle at top, ${accentColor} 0%, transparent 70%)`
        }}
      />
      
      {/* Floating blur spheres */}
      <div 
        className="absolute -left-20 top-10 w-44 h-44 rounded-full opacity-10 dark:opacity-15 blur-3xl pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />
      <div 
        className="absolute -right-20 bottom-0 w-44 h-44 rounded-full opacity-10 dark:opacity-15 blur-3xl pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
        {/* Back Link */}
        <Link href="/" className="mb-8 self-start md:self-auto">
          <Button variant="ghost" size="sm" className="rounded-full gap-2 text-xs font-bold hover:bg-white/10 dark:hover:bg-black/20">
            <ArrowLeft className="h-3 w-3" />
            <span>{t('common.backToHome')}</span>
          </Button>
        </Link>

        {/* Big Emoji */}
        <div 
          className="h-20 w-20 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-inner border border-white/20 dark:border-white/10 animate-bounce"
          style={{ 
            backgroundColor: `color-mix(in oklch, ${accentColor} 15%, transparent)`,
            boxShadow: `inset 0 2px 8px color-mix(in oklch, ${accentColor} 20%, transparent)`
          }}
        >
          {emoji}
        </div>

        {/* Title */}
        <h1 
          className="font-heading font-black text-4xl md:text-5xl tracking-wide mb-3 uppercase"
          style={{ color: `color-mix(in oklch, ${accentColor} 90%, var(--foreground))` }}
        >
          {title}
        </h1>

        {/* Tagline */}
        <p className="max-w-md text-sm md:text-base text-foreground/60 font-semibold leading-relaxed">
          {tagline}
        </p>
      </div>
    </section>
  )
}
