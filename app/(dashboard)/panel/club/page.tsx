"use client"

import React from "react"
import { GlassWater, Calendar, Users, Sparkles } from "lucide-react"
import { VenueSubNav } from "@/components/dashboard/venue-sub-nav"
import { useLanguage } from "@/lib/context/language-context"

export default function ClubPanelPage() {
  const { t } = useLanguage()
  const clubColor = "var(--venue-club)"

  const placeholderSections = [
    {
      title: t("panel.club.vipReservations"),
      desc: t("panel.club.vipReservationsDesc"),
      icon: Users,
      count: t("panel.club.vipReservationsCount")
    },
    {
      title: t("panel.club.barStock"),
      desc: t("panel.club.barStockDesc"),
      icon: GlassWater,
      count: t("panel.club.barStockCount")
    },
    {
      title: t("panel.club.eventCalendar"),
      desc: t("panel.club.eventCalendarDesc"),
      icon: Calendar,
      count: t("panel.club.eventCalendarCount")
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Sub Navigation */}
      <VenueSubNav venue="club" />

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 text-left">
        <div>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-foreground flex items-center gap-2.5">
            <GlassWater className="h-7 w-7" style={{ color: clubColor }} />
            <span>{t("panel.club.title")}</span>
          </h1>
          <p className="text-xs text-foreground/60 leading-relaxed font-semibold mt-1">
            {t("panel.club.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-card text-xs font-bold text-foreground w-fit">
          <span>{t("panel.common.status")}</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-500 font-extrabold">{t("panel.common.live")}</span>
        </div>
      </div>

      {/* Main Grid Draft placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {placeholderSections.map((sec, idx) => {
          const Icon = sec.icon
          return (
            <div key={idx} className="glass-panel p-6 rounded-3xl border-white/20 dark:border-black/10 text-left flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div
                  className="p-3 rounded-2xl border text-white"
                  style={{
                    borderColor: clubColor,
                    backgroundColor: "rgba(140,80,240,0.1)",
                    color: clubColor
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-foreground bg-white/5 px-2.5 py-1 rounded-xl border border-white/10 max-w-[140px] truncate text-center">
                  {sec.count}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-heading font-black text-base text-foreground tracking-wide">
                  {sec.title}
                </h3>
                <p className="text-xs text-foreground/60 leading-relaxed font-semibold">
                  {sec.desc}
                </p>
              </div>
              <div className="w-full h-[1px] bg-border my-2" />
              <button className="text-[10px] uppercase font-extrabold tracking-wider text-foreground/45 hover:text-primary transition-all text-left">
                {t("panel.common.loading")}
              </button>
            </div>
          )
        })}
      </div>

      {/* Center Notice */}
      <div className="p-8 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center text-center gap-4 py-16 bg-card/25">
        <div className="p-4 bg-white/5 dark:bg-black/20 rounded-full border border-border">
          <Sparkles className="h-8 w-8 text-foreground/40" style={{ color: clubColor }} />
        </div>
        <h3 className="font-heading font-black text-lg tracking-tight">
          {t("panel.club.noticeTitle")}
        </h3>
        <p className="max-w-md text-xs text-foreground/60 leading-relaxed font-semibold">
          {t("panel.club.noticeDesc")}
        </p>
      </div>
    </div>
  )
}
