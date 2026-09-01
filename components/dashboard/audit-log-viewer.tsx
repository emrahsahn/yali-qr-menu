"use client"

import React, { useState, useEffect } from "react"
import { auditLogger, AuditLogEntry, AuditActionType } from "@/lib/services/audit-logger"
import { DEFAULT_WAITERS, useStaff } from "@/lib/context/staff-context"
import {
  History,
  Search,
  Filter,
  CheckCircle,
  ChefHat,
  Edit3,
  UserCheck,
  UserPlus,
  UserMinus,
  BellRing,
  RefreshCw
} from "lucide-react"

interface AuditLogViewerProps {
  venue?: string;
}

export function AuditLogViewer({ venue }: AuditLogViewerProps = {}) {
  const { waiters } = useStaff()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [waiterFilter, setWaiterFilter] = useState<string>("ALL")
  const [actionFilter, setActionFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const loadLogs = () => {
    setLogs(auditLogger.getLogs())
  }

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadLogs();
    });

    // Listen for realtime audit logs
    if (typeof window !== "undefined") {
      const bc = new BroadcastChannel("yali_staff_events")
      bc.onmessage = (event) => {
        if (event.data?.type === "AUDIT_LOG_ADDED") {
          loadLogs()
        }
      }
      return () => {
        active = false;
        bc.close();
      }
    }
    return () => {
      active = false;
    };
  }, [])

  const getVenueLabel = (v?: string) => {
    switch (v) {
      case "cafe": return "Konteynır Cafe"
      case "club": return "Yalı Club & Bar"
      case "seafood": return "Deniz Ürünleri"
      default: return "Yalı Restaurant"
    }
  }

  const getActionBadge = (actionType: AuditActionType) => {
    switch (actionType) {
      case "ORDER_APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
            <ChefHat className="h-3 w-3" /> Sipariş Onaylandı
          </span>
        )
      case "ORDER_EDITED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
            <Edit3 className="h-3 w-3" /> Ürün Düzenlendi
          </span>
        )
      case "ORDER_CLOSED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
            <CheckCircle className="h-3 w-3" /> Masa Kapatıldı / Hesap Alındı
          </span>
        )
      case "TABLE_ASSIGNED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-[11px] font-bold">
            <UserCheck className="h-3 w-3" /> Masa Sorumluluğu
          </span>
        )
      case "WAITER_ADDED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold">
            <UserPlus className="h-3 w-3" /> Personel / PIN İşlemi
          </span>
        )
      case "WAITER_DELETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-bold">
            <UserMinus className="h-3 w-3" /> Personel Silindi
          </span>
        )
      case "CALL_RESOLVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-[11px] font-bold">
            <BellRing className="h-3 w-3" /> Çağrı Yanıtlandı
          </span>
        )
      default:
        return null
    }
  }

  // Pre-filter by venue if prop is set
  const venueLogs = venue
    ? logs.filter(log => (log.venue || "restaurant") === venue)
    : logs

  const filteredLogs = venueLogs.filter(log => {
    const matchesWaiter = waiterFilter === "ALL" || log.waiterName === waiterFilter
    const matchesAction = actionFilter === "ALL" || log.actionType === actionFilter
    const matchesSearch =
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.waiterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.tableName && log.tableName.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesWaiter && matchesAction && matchesSearch
  })

  // Get relevant staff for the dropdown — live list from StaffContext,
  // falling back to defaults while nothing is stored yet.
  const waiterSource = waiters.length > 0 ? waiters : DEFAULT_WAITERS
  const relevantWaiters = waiterSource.filter(w => !venue || (w.venue || "restaurant") === venue)

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Filters Header Bar */}
      <div className="glass-panel p-5 rounded-3xl border-white/20 dark:border-black/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 bg-primary/10 rounded-2xl text-primary shrink-0">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-foreground">
              {venue ? `${getVenueLabel(venue)} — ` : ""}Garson Eylem & Denetim Günlüğü
            </h3>
            <p className="text-xs text-foreground/60 font-semibold mt-0.5">
              {venue
                ? `${getVenueLabel(venue)} garsonlarının tüm sipariş, hesap ve masa hareketleri anlık olarak kaydedilir.`
                : "Tüm garson eylemleri, sipariş onayları ve masa işlemleri anlık olarak güncellenir."}
            </p>
          </div>
        </div>

        <button
          onClick={loadLogs}
          className="p-2.5 rounded-xl bg-card border border-border text-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
          title="Günlüğü Yenile"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <input
            type="text"
            placeholder="Açıklama veya masa ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Waiter Filter */}
        <div className="relative flex items-center">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <select
            value={waiterFilter}
            onChange={(e) => setWaiterFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
          >
            <option value="ALL">Tüm Personel</option>
            {relevantWaiters.map(w => (
              <option key={w.id} value={w.name}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Action Filter */}
        <div className="relative flex items-center">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
          >
            <option value="ALL">Tüm Eylem Türleri</option>
            <option value="ORDER_APPROVED">Sipariş Onayları</option>
            <option value="ORDER_EDITED">Ürün Düzenlemeleri</option>
            <option value="ORDER_CLOSED">Hesap / Masa Kapatma</option>
            <option value="TABLE_ASSIGNED">Masa Sorumluluğu</option>
            <option value="WAITER_ADDED">Personel / PIN İşlemleri</option>
            <option value="WAITER_DELETED">Personel Silme</option>
            <option value="CALL_RESOLVED">Çağrı Yanıtlama</option>
          </select>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="glass-panel p-5 rounded-3xl border-white/20 dark:border-black/10 flex flex-col gap-3">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-foreground/50 italic">
            Filtrelere uygun eylem kaydı bulunamadı.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredLogs.map(log => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/10 dark:border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-card transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {log.waiterName.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-black text-sm text-foreground">
                        {log.waiterName}
                      </span>
                      {getActionBadge(log.actionType)}
                    </div>
                    <p className="text-xs text-foreground/75 font-semibold mt-1">
                      {log.details}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 border-border/40 pt-2 sm:pt-0">
                  {log.amount !== undefined && (
                    <span className="font-heading font-black text-sm text-primary">
                      ₺{log.amount.toLocaleString("tr-TR")}
                    </span>
                  )}
                  <span className="text-[10px] text-foreground/45 font-semibold">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
