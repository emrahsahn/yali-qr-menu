"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useStaff } from "@/lib/context/staff-context"
import { KeyRound, Delete, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from "lucide-react"
import { YaliLogo } from "@/components/ui/yali-logo"

export function WaiterPinLockModal() {
  const { isLocked, loginWithPin, waiters } = useStaff()
  const [pin, setPin] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const [successWaiterName, setSuccessWaiterName] = useState<string | null>(null)

  const handleDigit = useCallback((digit: string) => {
    if (pin.length < 4) {
      setErrorMessage(null)
      const newPin = pin + digit
      setPin(newPin)

      // Automatically attempt login when 4 digits are reached
      if (newPin.length === 4) {
        setTimeout(() => {
          const result = loginWithPin(newPin)
          if (result.success && result.waiter) {
            setSuccessWaiterName(result.waiter.name)
            setTimeout(() => {
              setPin("")
              setSuccessWaiterName(null)
            }, 600)
          } else {
            setIsShaking(true)
            setErrorMessage(result.error || "Hatalı PIN kodu! Lütfen tekrar deneyin.")
            setTimeout(() => {
              setIsShaking(false)
              setPin("")
            }, 500)
          }
        }, 100)
      }
    }
  }, [pin, loginWithPin])

  const handleBackspace = useCallback(() => {
    setErrorMessage(null)
    setPin(prev => prev.slice(0, -1))
  }, [])

  const handleClear = useCallback(() => {
    setErrorMessage(null)
    setPin("")
  }, [])

  // Hardware keyboard listener
  useEffect(() => {
    if (!isLocked) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key)
      } else if (e.key === "Backspace") {
        handleBackspace()
      } else if (e.key === "Escape" || e.key === "Delete") {
        handleClear()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isLocked, handleDigit, handleBackspace, handleClear])

  if (!isLocked) return null

  const activeWaitersList = waiters.filter(w => w.isActive)

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div
        className={`glass-panel p-6 sm:p-8 rounded-3xl border border-white/20 dark:border-white/10 max-w-sm sm:max-w-md w-full text-center flex flex-col items-center gap-6 relative shadow-2xl transition-transform duration-200 ${
          isShaking ? "animate-shake" : "animate-in fade-in zoom-in"
        }`}
      >
        {/* Brand Mark */}
        <div className="relative">
          <YaliLogo size="lg" shadow />
          <div className="absolute -bottom-1 -right-1 p-1.5 bg-card rounded-full border border-border shadow-xs">
            {successWaiterName ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <KeyRound className="h-3.5 w-3.5 text-amber-400" />
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="flex flex-col gap-1">
          <h2 className="font-heading font-black text-2xl text-foreground tracking-wide">
            {successWaiterName ? (
              <span className="text-emerald-500 flex items-center justify-center gap-1.5">
                <Sparkles className="h-5 w-5" />
                Hoş Geldiniz, {successWaiterName}!
              </span>
            ) : (
              "Garson PIN Doğrulama"
            )}
          </h2>
          <p className="text-xs text-foreground/60 font-semibold max-w-xs mx-auto">
            {successWaiterName
              ? "Masalarınız ve sipariş paneliniz yükleniyor..."
              : "Masalarınızı ve siparişlerinizi yönetmek için 4 haneli PIN kodunuzu girin."}
          </p>
        </div>

        {/* PIN Dot Indicators */}
        <div className="flex items-center justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? "bg-primary scale-125 shadow-md shadow-primary/50"
                    : "bg-muted-foreground/30 border border-border"
                } ${isShaking ? "bg-rose-500 border-rose-400" : ""}`}
              />
            )
          })}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="flex items-center gap-2 text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2 rounded-xl animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Numeric Keypad (Numpad) */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-card hover:bg-muted border border-border font-heading font-black text-xl text-foreground transition-all duration-150 active:scale-92 cursor-pointer shadow-xs hover:border-primary/40 flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-card/60 hover:bg-muted/80 border border-border font-heading font-bold text-xs text-foreground/60 transition-all active:scale-92 cursor-pointer flex items-center justify-center uppercase tracking-wider"
            title="Temizle"
          >
            Temizle
          </button>

          {/* 0 Button */}
          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="h-14 rounded-2xl bg-card hover:bg-muted border border-border font-heading font-black text-xl text-foreground transition-all duration-150 active:scale-92 cursor-pointer shadow-xs hover:border-primary/40 flex items-center justify-center"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-card/60 hover:bg-muted/80 border border-border text-foreground/70 transition-all active:scale-92 cursor-pointer flex items-center justify-center"
            title="Sil"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        {/* Demo Staff PIN Helper Badge */}
        <div className="w-full pt-4 border-t border-border flex flex-col gap-2 text-left bg-card/30 p-3 rounded-2xl">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-black text-foreground/60 tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Test Personelleri & PIN Kodları:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeWaitersList.map(w => (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  setErrorMessage(null)
                  setPin(w.pinCode)
                  setTimeout(() => {
                    const result = loginWithPin(w.pinCode)
                    if (result.success && result.waiter) {
                      setSuccessWaiterName(result.waiter.name)
                      setTimeout(() => {
                        setPin("")
                        setSuccessWaiterName(null)
                      }, 500)
                    }
                  }, 80)
                }}
                className="px-2.5 py-1 rounded-xl bg-card border border-border hover:border-primary text-[11px] font-bold text-foreground/80 hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                title={`${w.name} olarak hızlı giriş yap`}
              >
                <span className={`w-2 h-2 rounded-full ${w.avatarColor}`} />
                <span>{w.name}</span>
                <span className="text-[10px] text-foreground/50 font-mono">({w.pinCode})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
