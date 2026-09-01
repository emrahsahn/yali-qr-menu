"use client"

import React from "react"
import Image from "next/image"

type YaliLogoSize = "sm" | "md" | "lg"

const SIZE_STYLES: Record<YaliLogoSize, { box: string; image: number }> = {
  sm: { box: "w-7 h-7 p-1 rounded-lg border", image: 20 },
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
 * stays legible on both light and dark backgrounds — mirrors the customer
 * preloader treatment (#FDFCFA paper + gold border).
 */
export function YaliLogo({ size = "md", className = "", shadow = false }: YaliLogoProps) {
  const styles = SIZE_STYLES[size]

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 bg-[#FDFCFA] border-[#B98A4A]/30 dark:border-[#B98A4A]/40 ${
        styles.box
      } ${shadow ? "shadow-md shadow-[#B98A4A]/20" : "shadow-xs"} ${className}`}
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
