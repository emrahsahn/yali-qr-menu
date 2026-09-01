"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import {
  QrCode,
  Layers,
  LogOut,
  Shield,
  X,
  ExternalLink,
  Utensils
} from "lucide-react"

export function DashboardSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      <aside
        className={`w-64 bg-card border-r border-border flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Branding */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <Link href="/panel" className="flex items-center gap-3" onClick={onClose}>
            <div className="bg-primary/10 p-2 rounded-xl border border-primary/20 text-primary">
              <Utensils className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading font-black text-base tracking-wider text-foreground">
                YALI RESTAURANT
              </span>
              <span className="text-[9px] uppercase tracking-widest font-bold text-primary -mt-1">
                GÖREVLİ PANELİ
              </span>
            </div>
          </Link>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-xl hover:bg-muted text-foreground/60 hover:text-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-foreground/45 px-3 mb-1 text-left">
              Menü & QR Yönetimi
            </span>

            <Link
              href="/panel"
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                pathname === "/panel" || pathname === "/panel/restaurant" || pathname === "/panel/restaurant/qr"
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                  : "text-foreground/75 hover:bg-muted hover:text-foreground"
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span>Masa & QR Menü Paneli</span>
            </Link>

            <Link
              href="/menu"
              target="_blank"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-foreground/75 hover:bg-muted hover:text-foreground transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="h-4 w-4 text-primary" />
                <span>Müşteri Menüsü (Önizle)</span>
              </div>
            </Link>
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-border flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              {user.displayName.charAt(0)}
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-bold text-foreground truncate">
                {user.displayName}
              </span>
              <span className="text-[10px] text-foreground/45 uppercase tracking-wider font-extrabold truncate">
                Restoran Görevlisi
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/10 transition-all duration-300 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>
    </>
  )
}
