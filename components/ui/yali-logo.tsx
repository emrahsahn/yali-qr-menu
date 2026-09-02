"use client"

import React from "react"
import Image from "next/image"

type YaliLogoSize = "xs" | "sm" | "md" | "lg"

const SIZE_STYLES: Record<YaliLogoSize, { box: string; image: number }> = {
  xs: { box: "w-7 h-7 p-0.5 rounded-lg border", image: 24 },
  sm: { box: "w-8 h-8 p-1 rounded-xl border", image: 28 },
  md: { box: "w-12 h-12 p-1.5 rounded-2xl border", image: 40 },
  lg: { box: "w-16 h-16 p-2 rounded-2xl border", image: 52 },
}

interface YaliLogoProps {
  size?: YaliLogoSize
  className?: string
  /** Adds a soft elevation shadow (use on hero/header spots). */
  shadow?: boolean
}

/**
 * Official Yalı brand mark (public/logo.png) inside a light paper badge so it
 * stays legible on both light and dark backgrounds.
 */
export function YaliLogo({ size = "md", className = "", shadow = false }: YaliLogoProps) {
  const styles = SIZE_STYLES[size] || SIZE_STYLES.md

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 bg-[#FDFCFA] border-[#B98A4A]/30 dark:border-[#B98A4A]/40 overflow-hidden ${
        styles.box
      } ${shadow ? "shadow-sm shadow-[#B98A4A]/20" : "shadow-xs"} ${className}`}
    >
      <Image
        src="/logo.png"
        alt="Yalı"
        width={styles.image}
        height={styles.image}
        unoptimized
        className="w-full h-full object-contain"
      />
    </span>
  )
}
