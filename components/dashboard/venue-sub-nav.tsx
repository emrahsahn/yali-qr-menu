"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { useLanguage } from "@/lib/context/language-context"
import {
  Utensils,
  Coffee,
  GlassWater,
  Fish,
  QrCode,
  Layers,
  Users,
  History,
  type LucideIcon
} from "lucide-react"

interface VenueSubNavProps {
  venue: "restaurant" | "cafe" | "club" | "seafood"
}

export function VenueSubNav({ venue }: VenueSubNavProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { t } = useLanguage()
  const isAdmin = user?.role === "admin"

  const baseTabsByVenue: Record<
    "restaurant" | "cafe" | "club" | "seafood",
    { label: string; href: string; icon: LucideIcon; exact?: boolean }[]
  > = {
    restaurant: [
      {
        label: t("subnav.restaurant.pos"),
        href: "/panel/restaurant",
        icon: Utensils,
        exact: true
      },
      {
        label: t("subnav.restaurant.menu"),
        href: "/panel/restaurant/menu",
        icon: Layers,
        exact: false
      },
      {
        label: t("subnav.restaurant.qr"),
        href: "/panel/restaurant/qr",
        icon: QrCode,
        exact: false
      }
    ],
    cafe: [
      {
        label: t("subnav.cafe.barista"),
        href: "/panel/cafe",
        icon: Coffee,
        exact: true
      }
    ],
    club: [
      {
        label: t("subnav.club.vip"),
        href: "/panel/club",
        icon: GlassWater,
        exact: true
      }
    ],
    seafood: [
      {
        label: t("subnav.seafood.kitchen"),
        href: "/panel/seafood",
        icon: Fish,
        exact: true
      }
    ]
  }

  const baseTabs = baseTabsByVenue[venue] || []

  // Add admin-only tabs
  const adminTabs = isAdmin
    ? [
        {
          label: t("subnav.common.staff"),
          href: `/admin/${venue}/staff`,
          icon: Users,
          exact: false
        },
        {
          label: t("subnav.common.logs"),
          href: `/admin/${venue}/logs`,
          icon: History,
          exact: false
        }
      ]
    : []

  const allTabs = [...baseTabs, ...adminTabs]

  return (
    <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto no-scrollbar -mt-2">
      {allTabs.map((tab, idx) => {
        const Icon = tab.icon
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)

        return (
          <Link
            key={idx}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "bg-card hover:bg-muted text-foreground/70 hover:text-foreground border border-border"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
