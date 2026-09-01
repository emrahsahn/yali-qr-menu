"use client"

import React, { useState, useEffect } from "react"
import { TrendingUp, Users, PieChart, Building2, Info, BarChart3 } from "lucide-react"
import { auditLogger, AuditLogEntry } from "@/lib/services/audit-logger"

export function AdminCharts() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (!active) return
      setLogs(auditLogger.getLogs())
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="p-6 rounded-3xl bg-card border border-border flex flex-col items-center justify-center text-center gap-3">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
          <BarChart3 className="h-6 w-6" />
        </div>
        <h3 className="font-heading font-black text-lg text-foreground">
          Sistem İstatistikleri & Özet
        </h3>
        <p className="text-xs text-foreground/60 max-w-md font-medium">
          Toplam {logs.length} adet sistem kaydı mevcut. Detaylı ürün ve QR yönetimi için Menü sekmesini kullanabilirsiniz.
        </p>
      </div>
    </div>
  )
}
