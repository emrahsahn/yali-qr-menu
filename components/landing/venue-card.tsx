"use client"

import React from "react"
import Link from "next/link"
import { useLanguage } from "@/lib/context/language-context"
import { ArrowUpRight } from "lucide-react"

interface VenueCardProps {
  title: string
  description: string
  href: string
  emoji: string
  accentColor: string // CSS custom property like var(--venue-cafe)
  accentGlowClass: string // Class to add colored shadows
}

export function VenueCard({
  title,
  description,
  href,
  emoji,
  accentColor,
  accentGlowClass
}: VenueCardProps) {
  const { t } = useLanguage()

  return (
    <Link
      href={href}
      className={`group relative flex flex-col p-6 rounded-3xl glass-panel glass-panel-hover transition-all duration-500 overflow-hidden cursor-pointer border-white/20 dark:border-white/10 ${accentGlowClass}`}
      style={{
        // Custom background glow on hover using custom property
        outlineColor: accentColor
      } as React.CSSProperties}
    >
      {/* Background radial accent glow */}
      <div 
        className="absolute -right-16 -top-16 w-36 h-36 rounded-full opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all duration-500 blur-3xl"
        style={{ backgroundColor: accentColor }}
      />
      
      {/* Icon/Emoji Container */}
      <div 
        className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 shadow-inner border border-white/10 dark:border-white/5 transition-transform duration-500 group-hover:scale-110"
        style={{ 
          backgroundColor: `color-mix(in oklch, ${accentColor} 12%, transparent)`,
          color: accentColor
        }}
      >
        {emoji}
      </div>

      {/* Title */}
      <div className="flex items-center gap-1.5 mb-2">
        <h3 className="font-heading font-black text-xl tracking-tight transition-colors duration-300 group-hover:text-primary">
          {title}
        </h3>
        <ArrowUpRight className="h-4 w-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300 text-primary" />
      </div>

      {/* Description */}
      <p className="text-xs text-foreground/60 leading-relaxed font-semibold mb-6 flex-grow">
        {description}
      </p>

      {/* CTA Button */}
      <div 
        className="text-[10px] uppercase font-black tracking-widest flex items-center gap-1 transition-all duration-300"
        style={{ color: accentColor }}
      >
        <span>{t('common.explore')}</span>
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </div>
    </Link>
  )
}
