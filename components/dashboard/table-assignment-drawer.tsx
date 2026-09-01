"use client"

import React from "react"
import { useStaff } from "@/lib/context/staff-context"
import { Utensils, X, CheckCircle2, Circle } from "lucide-react"

interface TableAssignmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TableAssignmentDrawer({ isOpen, onClose }: TableAssignmentDrawerProps) {
  const { activeWaiter, allTables, tableAssignments, toggleTableAssignment } = useStaff()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-3xl border-white/20 dark:border-black/10 max-w-xl w-full text-left flex flex-col gap-6 relative animate-in fade-in zoom-in duration-200 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <Utensils className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-foreground">
                Masa Sorumluluğu Düzenle
              </h2>
              <p className="text-xs text-foreground/60 font-semibold mt-0.5">
                <span className="font-bold text-primary">{activeWaiter?.name || "Görevli"}</span> olarak bakacağınız masaları işaretleyin.
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

        {/* Content list */}
        <div className="overflow-y-auto pr-1 flex flex-col gap-3">
          <p className="text-xs text-foreground/70 font-semibold">
            İşaretlediğiniz masalardan sipariş geldiğinde anlık sesli ve görsel bildirim alırsınız:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allTables.map((table) => {
              const assignedWaiters = tableAssignments[table.id] || []
              const isAssignedToMe = Boolean(activeWaiter?.name && assignedWaiters.includes(activeWaiter.name))

              return (
                <button
                  key={table.id}
                  onClick={() => toggleTableAssignment(table.id)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all duration-300 cursor-pointer ${
                    isAssignedToMe
                      ? "bg-primary/10 border-primary text-primary shadow-md"
                      : "bg-white/40 dark:bg-black/20 border-white/10 dark:border-black/10 hover:border-primary/40 hover:bg-card text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-black text-base truncate">
                      {table.masa_adi || `Masa ${table.masa_no}`}
                    </span>
                    {isAssignedToMe ? (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-foreground/30 shrink-0" />
                    )}
                  </div>

                  {/* Waiter badges */}
                  <div className="flex flex-wrap gap-1">
                    {assignedWaiters.length === 0 ? (
                      <span className="text-[10px] italic text-foreground/40 font-semibold">
                        Sorumlu yok
                      </span>
                    ) : (
                      assignedWaiters.map((wName, idx) => (
                        <span
                          key={idx}
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            activeWaiter?.name && wName === activeWaiter.name
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground/70"
                          }`}
                        >
                          {wName}
                        </span>
                      ))
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-md"
          >
            Tamamlandı
          </button>
        </div>
      </div>
    </div>
  )
}
