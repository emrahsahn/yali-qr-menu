"use client"

import React, { use } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { StaffManagementTab } from "@/components/dashboard/staff-management-tab"
import { StaffProvider } from "@/lib/context/staff-context"
import { YaliLogo } from "@/components/ui/yali-logo"
import {
  ArrowLeft,
  Users,
  History,
  Utensils,
  Coffee,
  GlassWater,
  Fish,
  ExternalLink,
  ChevronRight,
  type LucideIcon
} from "lucide-react"

const VALID_VENUES = ["restaurant", "cafe", "club", "seafood"] as const
type VenueType = typeof VALID_VENUES[number]

const VENUE_DETAILS: Record<VenueType, { name: string; icon: LucideIcon; color: string; panelHref: string }> = {
  restaurant: {
    name: "Yalı Restaurant",
    icon: Utensils,
    color: "var(--venue-restaurant)",
    panelHref: "/panel/restaurant"
  },
  cafe: {
    name: "Konteynır Cafe",
    icon: Coffee,
    color: "var(--venue-cafe)",
    panelHref: "/panel/cafe"
  },
  club: {
    name: "Yalı Club & Bar",
    icon: GlassWater,
    color: "var(--venue-club)",
    panelHref: "/panel/club"
  },
  seafood: {
    name: "Yalı Deniz Ürünleri",
    icon: Fish,
    color: "var(--venue-seafood)",
    panelHref: "/panel/seafood"
  }
}

interface PageProps {
  params: Promise<{ venue: string }>
}

export default function AdminVenueStaffPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const venue = resolvedParams.venue as VenueType

  if (!VALID_VENUES.includes(venue)) {
    notFound()
  }

  const details = VENUE_DETAILS[venue]
  const VenueIcon = details.icon

  return (
    <StaffProvider>
      <div className="flex flex-col gap-6">
        {/* Breadcrumb & Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-bold text-foreground/60 flex-wrap">
            <Link
              href="/admin"
              className="hover:text-primary transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-card border border-border"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Admin Merkezi</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-foreground/30" />
            <div className="flex items-center gap-1.5 text-foreground">
              {venue === "restaurant" ? (
                <YaliLogo size="sm" />
              ) : (
                <VenueIcon className="h-4 w-4" style={{ color: details.color }} />
              )}
              <span>{details.name}</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-foreground/30" />
            <span className="text-primary font-black">Personel & PIN Yönetimi</span>
          </div>

          {/* Quick Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/admin/${venue}/staff`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Personel & PIN</span>
            </Link>

            <Link
              href={`/admin/${venue}/logs`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card hover:bg-muted text-foreground/70 hover:text-foreground border border-border text-xs font-bold transition-all"
            >
              <History className="h-3.5 w-3.5" />
              <span>Eylem Günlüğü</span>
            </Link>

            <Link
              href={details.panelHref}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card hover:bg-muted text-foreground/70 hover:text-foreground border border-border text-xs font-bold transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Canlı Panel</span>
            </Link>
          </div>
        </div>

        {/* Staff Management Content for this venue */}
        <StaffManagementTab venue={venue} />
      </div>
    </StaffProvider>
  )
}
