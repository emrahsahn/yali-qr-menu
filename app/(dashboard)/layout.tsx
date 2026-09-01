"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login")
        return
      }

      // Security guard for staff to prevent them from accessing unauthorized panels
      const isStaff = user.role === "staff"
      if (isStaff) {
        if (pathname.startsWith("/admin")) {
          router.replace(`/panel/${user.venue}`)
          return
        }
        if (pathname.startsWith("/panel/")) {
          const venuePath = pathname.split("/")[2] // e.g. panel/restaurant -> restaurant
          if (venuePath && venuePath !== user.venue) {
            router.replace(`/panel/${user.venue}`)
            return
          }
        }
      }
    }
  }, [user, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect via useEffect
  }

  // If staff is on an unauthorized path, render nothing while useEffect redirects
  const isStaff = user.role === "staff"
  if (isStaff) {
    if (pathname.startsWith("/admin")) {
      return null
    }
    if (pathname.startsWith("/panel/")) {
      const venuePath = pathname.split("/")[2]
      if (venuePath && venuePath !== user.venue) {
        return null
      }
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar - fixed left on desktop, drawer on mobile */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-0 md:pl-64 w-full">
        <DashboardHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8 bg-gradient-to-b from-amber-500/2 via-transparent to-primary/2">
          {children}
        </main>
      </div>
    </div>
  )
}
