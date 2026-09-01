"use client"

import React, { useState } from "react"
import { OrderSession } from "@/lib/types/database"
import { useStaff } from "@/lib/context/staff-context"
import { OrderEditModal } from "./order-edit-modal"
import { Clock, CheckCircle, ChefHat, Bell, UserCheck, Edit3 } from "lucide-react"

interface OrderCardProps {
  order: OrderSession;
}

export function OrderCard({ order }: OrderCardProps) {
  const { activeWaiter, updateOrderStatus } = useStaff()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const assignedWaiters = order.assigned_waiters || []
  const isAssignedToMe = Boolean(activeWaiter?.name && assignedWaiters.includes(activeWaiter.name))

  // Calculate total price
  const totalPrice = (order.cart_items || []).reduce((acc, item) => {
    return acc + (item.product?.fiyat || 0) * item.adet
  }, 0)

  // Status mapping
  const getStatusBadge = () => {
    switch (order.status) {
      case "pending_approval":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black animate-pulse">
            <Bell className="h-3.5 w-3.5" />
            <span>ONAY BEKLİYOR</span>
          </div>
        )
      case "confirmed":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-black">
            <ChefHat className="h-3.5 w-3.5" />
            <span>MUTFAKTA / HAZIRLANIYOR</span>
          </div>
        )
      case "closed":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>TAMAMLANDI</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-foreground/60 text-xs font-bold">
            <span>Taslak</span>
          </div>
        )
    }
  }

  return (
    <>
      <div
        className={`glass-panel p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between text-left relative overflow-hidden ${
          isAssignedToMe
            ? "border-primary/40 shadow-lg shadow-primary/5 bg-gradient-to-b from-primary/5 via-card to-card"
            : "border-white/20 dark:border-black/10 hover:border-border"
        }`}
      >
        {/* Top Banner */}
        <div>
          <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3 mb-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-xl text-foreground">
                  {order.table_name || `Masa ${order.table_no || 1}`}
                </span>
                {isAssignedToMe && (
                  <span className="bg-primary text-primary-foreground text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <UserCheck className="h-3 w-3" /> Masam
                  </span>
                )}
              </div>
              <span className="text-[10px] text-foreground/50 font-semibold flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" /> Tur #{order.tur_no} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {getStatusBadge()}
          </div>

          {/* Assigned Waiters Bar */}
          <div className="flex items-center gap-1.5 mb-4 text-xs font-semibold text-foreground/70 bg-white/40 dark:bg-black/20 p-2 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-60">Sorumlular:</span>
            {assignedWaiters.length === 0 ? (
              <span className="text-[10px] italic opacity-50">Henüz garson atanmadı</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {assignedWaiters.map((name, idx) => (
                  <span
                    key={idx}
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                      activeWaiter?.name && name === activeWaiter.name
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground/80"
                    }`}
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Cart Items List Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-foreground/45">
              Sipariş İçeriği ({order.cart_items?.length || 0} Çeşit)
            </span>

            {order.status !== "closed" && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-[10px] text-primary hover:underline font-extrabold flex items-center gap-1 cursor-pointer bg-primary/10 px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors"
                title="Ürün ekle veya çıkar"
              >
                <Edit3 className="h-3 w-3" /> Ürün Ekle / Çıkar
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex flex-col gap-2.5 mb-6">
            {order.cart_items && order.cart_items.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {order.cart_items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between text-xs py-1 border-b border-border/40 last:border-0">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">
                        {item.adet}x {item.product?.ad_tr || "Ürün"}
                      </span>
                      {item.not_text && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 italic font-semibold">
                          Not: &quot;{item.not_text}&quot;
                        </span>
                      )}
                    </div>
                    <span className="font-extrabold text-foreground/80 shrink-0">
                      ₺{((item.product?.fiyat || 0) * item.adet).toLocaleString("tr-TR")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-foreground/40 italic py-2">
                Henüz ürün seçilmedi
              </div>
            )}
          </div>
        </div>

        {/* Footer & Action Buttons */}
        <div className="border-t border-border/60 pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground/60">Toplam Tutar:</span>
            <span className="font-heading font-black text-lg text-primary">
              ₺{totalPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Action button based on status */}
          {order.status === "pending_approval" && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => updateOrderStatus(order.id, "confirmed")}
                className="w-full bg-amber-500 text-white py-3 rounded-2xl font-black text-xs hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer animate-bounce"
              >
                <ChefHat className="h-4 w-4" />
                <span>Siparişi Onayla & Mutfağa Gönder</span>
              </button>
            </div>
          )}

          {order.status === "confirmed" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 bg-card hover:bg-muted text-foreground border border-border py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5 text-primary" />
                <span>Ekle / Çıkar</span>
              </button>

              <button
                onClick={() => updateOrderStatus(order.id, "closed")}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-black text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Teslim Edildi</span>
              </button>
            </div>
          )}

          {order.status === "closed" && (
            <div className="w-full text-center py-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 rounded-xl">
              ✓ Sipariş Tamamlandı
            </div>
          )}
        </div>
      </div>

      {/* Order Edit Modal */}
      <OrderEditModal
        order={order}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  )
}
