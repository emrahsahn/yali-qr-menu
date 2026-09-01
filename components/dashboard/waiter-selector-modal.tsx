"use client"

import React, { useState } from "react"
import { useStaff, WaiterProfile } from "@/lib/context/staff-context"
import { UserCheck, X, Check, Plus, Trash2, UserPlus } from "lucide-react"

interface WaiterSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaiterSelectorModal({ isOpen, onClose }: WaiterSelectorModalProps) {
  const { waiters, activeWaiter, deleteWaiter } = useStaff()
  const [newWaiterName, setNewWaiterName] = useState("")

  if (!isOpen) return null

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleDelete = (e: React.MouseEvent, waiter: WaiterProfile) => {
    e.stopPropagation()
    if (waiters.length <= 1) {
      alert("En az bir garson profilinin bulunması gereklidir.")
      return
    }
    if (confirm(`'${waiter.name}' garson profilini silmek istediğinize emin misiniz?`)) {
      deleteWaiter(waiter.id)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-3xl border-white/20 dark:border-black/10 max-w-lg w-full text-left flex flex-col gap-6 relative animate-in fade-in zoom-in duration-200 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-foreground">
                Garson Yönetimi & Kimlik Seçimi
              </h2>
              <p className="text-xs text-foreground/60 font-semibold mt-0.5">
                Kendi garson profilinizi seçin veya yeni garson ekleyip çıkarın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-foreground/50 hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Add New Waiter Form */}
        <form onSubmit={handleAddSubmit} className="flex items-center gap-2 bg-white/40 dark:bg-black/20 p-2 rounded-2xl border border-white/10 shrink-0">
          <div className="p-2 text-primary">
            <UserPlus className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Yeni Garson Adı (Örn: Mehmet)..."
            value={newWaiterName}
            onChange={(e) => setNewWaiterName(e.target.value)}
            className="flex-1 bg-transparent text-xs font-semibold text-foreground focus:outline-none placeholder:text-foreground/40"
          />
          <button
            type="submit"
            disabled={!newWaiterName.trim()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Garson Ekle
          </button>
        </form>

        {/* Waiters List */}
        <div className="overflow-y-auto max-h-60 pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {waiters.map((waiter) => {
            const isSelected = activeWaiter?.id === waiter.id

            return (
              <div
                key={waiter.id}
                onClick={onClose}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-300 cursor-pointer group ${
                  isSelected
                    ? "bg-primary/10 border-primary text-primary shadow-md"
                    : "bg-white/40 dark:bg-black/20 border-white/10 dark:border-black/10 hover:border-primary/40 hover:bg-card text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${waiter.avatarColor}`}>
                    {waiter.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-heading font-black text-sm text-foreground">
                      {waiter.name}
                    </span>
                    <span className="text-[9px] text-foreground/50 uppercase tracking-wider font-semibold">
                      Restoran Görevlisi
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </div>
                  )}

                  <button
                    onClick={(e) => handleDelete(e, waiter)}
                    className="p-1.5 text-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                    title="Garsonu Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info notice */}
        <p className="text-[10px] text-center text-foreground/50 font-semibold border-t border-border pt-3 shrink-0">
          💡 Profil seçimi veya yeni garson eklendiğinde, sistem sipariş bildirimlerini tüm aktif garsonlara anlık olarak senkronize eder.
        </p>
      </div>
    </div>
  )
}
