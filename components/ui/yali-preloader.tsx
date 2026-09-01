"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { ArrowRight, RotateCcw, Utensils } from "lucide-react"

interface YaliPreloaderProps {
  onComplete?: () => void
  forcePlay?: boolean
  tableName?: string
  tableNo?: number
}

export function YaliPreloader({
  onComplete,
  forcePlay = false,
  tableName,
  tableNo
}: YaliPreloaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [seqKey, setSeqKey] = useState(1) // Incremented to re-trigger CSS animations cleanly

  // Keep the latest callback in a ref so an unstable inline arrow from the
  // parent never re-triggers the animation sequence.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSequence = useCallback(() => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current)
    setIsVisible(true)
    setIsFadingOut(false)
    setIsOpen(false)
    setSeqKey((prev) => prev + 1)

    // Open doors after 1.65s
    openTimerRef.current = setTimeout(() => {
      setIsOpen(true)
    }, 1650)
  }, [])

  // Fade-out timer of "Menüyü İncele"
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    // Check if preloader was already dismissed in this session
    if (typeof window !== "undefined" && !forcePlay) {
      const alreadyShown = sessionStorage.getItem("yali_preloader_shown")
      if (alreadyShown) {
        // Deferred so state updates don't cascade synchronously in the effect body
        Promise.resolve().then(() => {
          if (!cancelled) {
            setIsVisible(false)
            onCompleteRef.current?.()
          }
        })
        return () => {
          cancelled = true
        }
      }
    }

    // Deferred start keeps the effect body free of synchronous state updates
    Promise.resolve().then(() => {
      if (!cancelled) runSequence()
    })
    return () => {
      cancelled = true
      if (openTimerRef.current) clearTimeout(openTimerRef.current)
    }
  }, [forcePlay, runSequence])

  // Clear pending timers on unmount
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
      if (openTimerRef.current) clearTimeout(openTimerRef.current)
    }
  }, [])

  const handleEnterMenu = () => {
    setIsFadingOut(true)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("yali_preloader_shown", "true")
    }
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    fadeTimerRef.current = setTimeout(() => {
      setIsVisible(false)
      setIsFadingOut(false)
      onCompleteRef.current?.()
    }, 500)
  }

  const handleReplay = () => {
    runSequence()
  }

  if (!isVisible) return null

  return (
    <div
      id="yali-preloader-container"
      key={seqKey}
      className={`fixed inset-0 z-50 overflow-hidden select-none pointer-events-auto bg-[#FDFCFA] transition-all duration-500 ${
        isFadingOut ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{ perspective: "2400px" }}
    >
      <style jsx>{`
        /* Decorative Orchid Art */
        .orchid-svg-wrap {
          position: absolute;
          top: 50%;
          width: clamp(80px, 11vw, 160px);
          transform: translateY(-50%);
          color: #B98A4A;
          pointer-events: none;
        }
        .orchid--left {
          left: clamp(12px, 4vw, 56px);
          animation: petalIn 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards 1.05s;
          opacity: 0;
        }
        .orchid--right {
          right: clamp(12px, 4vw, 56px);
          transform: translateY(-50%) scaleX(-1);
          animation: petalInR 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards 1.05s;
          opacity: 0;
        }
        @keyframes petalIn {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(-12px);
          }
          to {
            opacity: 0.75;
            transform: translateY(-50%) translateX(0);
          }
        }
        @keyframes petalInR {
          from {
            opacity: 0;
            transform: translateY(-50%) scaleX(-1) translateX(-12px);
          }
          to {
            opacity: 0.75;
            transform: translateY(-50%) scaleX(-1) translateX(0);
          }
        }

        /* 3D Split Doors (Leaves) */
        .leaf-door {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 50%;
          background: #FDFCFA;
          transition: transform 1.15s cubic-bezier(0.76, 0, 0.24, 1);
          transform-style: preserve-3d;
          will-change: transform;
        }
        .leaf-left {
          left: 0;
          transform-origin: 0% 50%;
          box-shadow: 6px 0 30px rgba(23, 20, 15, 0.08);
        }
        .leaf-right {
          right: 0;
          transform-origin: 100% 50%;
          box-shadow: -6px 0 30px rgba(23, 20, 15, 0.08);
        }
        .door-open .leaf-left {
          transform: rotateY(-98deg);
        }
        .door-open .leaf-right {
          transform: rotateY(98deg);
        }

        .central-spine {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 1px;
          transform: translateX(-50%);
          background: linear-gradient(180deg, transparent, rgba(185, 138, 74, 0.4) 50%, transparent);
          transition: opacity 0.4s ease 0.3s;
          z-index: 2;
        }
        .door-open .central-spine {
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        /* Opening Stage (Logo + Radial Glow) */
        .logo-stage-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3;
          transition: opacity 0.6s ease 0.15s;
        }
        .door-open .logo-stage-wrap {
          opacity: 0;
          pointer-events: none;
        }

        .logo-radial-glow {
          position: absolute;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(185, 138, 74, 0.2) 0%, rgba(185, 138, 74, 0) 70%);
          opacity: 0;
          transform: scale(0.6);
          animation: glowIn 1.8s ease-out forwards 0.15s;
        }
        @keyframes glowIn {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .logo-mask-clip {
          position: relative;
          width: min(48vw, 320px);
          clip-path: circle(0% at 50% 50%);
          animation: unveil 1.25s cubic-bezier(0.22, 1, 0.36, 1) forwards 0.25s;
        }
        @keyframes unveil {
          to {
            clip-path: circle(75% at 50% 50%);
          }
        }
        .logo-img-settle {
          display: block;
          width: 100%;
          height: auto;
          opacity: 0;
          transform: scale(0.88);
          animation: settle 1.25s cubic-bezier(0.22, 1, 0.36, 1) forwards 0.25s;
        }
        @keyframes settle {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Welcome Stage behind open doors */
        .site-stage {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #FDFCFA;
          z-index: 1;
        }
        .site-mark-fade {
          opacity: 0;
          animation: fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards 2.0s;
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Decorative Orchid SVG definition */}
      <svg className="hidden" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <g id="yali-orchid-art-def">
            <path d="M100 320 C100 240 88 200 60 170 C40 148 28 130 26 104" />
            <path d="M100 260 C120 240 128 214 118 188 C110 168 92 158 74 160" />
            <path d="M92 210 C70 196 58 172 62 146 C64 130 76 116 92 110" />
            <ellipse cx="46" cy="96" rx="22" ry="13" transform="rotate(-28 46 96)" />
            <ellipse cx="34" cy="118" rx="18" ry="10" transform="rotate(10 34 118)" />
            <ellipse cx="58" cy="128" rx="16" ry="9" transform="rotate(-55 58 128)" />
            <ellipse cx="44" cy="70" rx="14" ry="8" transform="rotate(-10 44 70)" />
            <circle cx="46" cy="96" r="4" />
            <path d="M60 170 C48 176 34 178 20 174" />
            <path d="M74 160 C86 150 96 138 100 122" />
            <path d="M118 188 C132 182 144 172 150 158" />
          </g>
        </defs>
      </svg>

      {/* Stage Behind Doors (Revealed upon opening) */}
      <div className="site-stage px-4 sm:px-6 text-center overflow-y-auto no-scrollbar py-6">
        {/* Left and Right Orchids in site stage */}
        <div className="orchid-svg-wrap orchid--left">
          <svg viewBox="0 0 200 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-full h-auto">
            <use href="#yali-orchid-art-def" />
          </svg>
        </div>

        {/* Central Brand Mark and Action Screen */}
        <div className="site-mark-fade flex flex-col items-center w-full max-w-md mx-auto my-auto py-4">
          {/* Logo Badge */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 mb-2 sm:mb-3">
            <Image
              src="/logo.png"
              alt="Yalı"
              fill
              unoptimized
              priority
              className="object-contain"
            />
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl text-[#17140F] font-normal tracking-wide leading-tight mb-1">
            Yalı
          </h1>
          <span className="font-heading italic text-[#B98A4A] uppercase text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] font-semibold mb-4 sm:mb-6">
            Restaurant & Lounge
          </span>

          {/* Table Welcome Hint */}
          {(tableName || tableNo) && (
            <div className="mb-5 sm:mb-6 px-4 py-1.5 rounded-full bg-[#B98A4A]/10 border border-[#B98A4A]/25 text-[#B98A4A] text-[11px] sm:text-xs font-black tracking-wide">
              {tableName ? tableName : `Masa ${tableNo}`} Hoş Geldiniz
            </div>
          )}

          {/* Action Buttons: "Menüyü İncele" & "Açılışı Tekrar Gör" */}
          <div className="flex flex-col gap-2.5 sm:gap-3 w-full max-w-[280px] sm:max-w-xs md:max-w-sm">
            <button
              type="button"
              onClick={handleEnterMenu}
              className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#B98A4A] hover:bg-[#A87B3E] text-white font-heading font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-[#B98A4A]/25 transition-all duration-300 hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              <Utensils className="h-4 w-4" />
              <span>Menüyü İncele</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>

            <button
              type="button"
              onClick={handleReplay}
              className="w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-transparent hover:bg-[#17140F]/5 text-[#17140F]/70 hover:text-[#17140F] border border-[#17140F]/15 font-heading font-bold text-[11px] sm:text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#B98A4A]" />
              <span>Açılışı Tekrar Gör</span>
            </button>
          </div>
        </div>

        <div className="orchid-svg-wrap orchid--right">
          <svg viewBox="0 0 200 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-full h-auto">
            <use href="#yali-orchid-art-def" />
          </svg>
        </div>
      </div>

      {/* 3D Doors Layer */}
      <div className={`w-full h-full relative z-10 ${isOpen ? "door-open pointer-events-none" : "pointer-events-auto"}`}>
        <div className="leaf-door leaf-left" />
        <div className="leaf-door leaf-right" />
        <div className="central-spine" />

        {/* Logo Stage with Glow on Doors */}
        <div className="logo-stage-wrap">
          {/* Left Orchid on door */}
          <div className="orchid-svg-wrap orchid--left">
            <svg viewBox="0 0 200 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-full h-auto">
              <use href="#yali-orchid-art-def" />
            </svg>
          </div>

          {/* Golden Radial Glow */}
          <div className="logo-radial-glow" />

          {/* Centered Yalı Logo */}
          <div className="logo-mask-clip flex justify-center items-center">
            <Image
              src="/logo.png"
              alt="Yalı Restaurant"
              width={320}
              height={320}
              unoptimized
              priority
              className="logo-img-settle object-contain"
            />
          </div>

          {/* Right Orchid on door */}
          <div className="orchid-svg-wrap orchid--right">
            <svg viewBox="0 0 200 320" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-full h-auto">
              <use href="#yali-orchid-art-def" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
