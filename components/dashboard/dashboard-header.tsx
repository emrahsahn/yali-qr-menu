"use client"

import React from "react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/lib/context/language-context"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Globe, Sun, Moon, Menu } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DashboardHeader({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const { theme, setTheme } = useTheme()
  const { setLang } = useLanguage()
  const pathname = usePathname()

  // Generate dynamic breadcrumb segments
  const getBreadcrumbs = () => {
    if (pathname === "/admin") {
      return [{ label: "Genel Yönetim", active: true }]
    }
    if (pathname === "/panel/restaurant") {
      return [
        { label: "Restaurant", active: false },
        { label: "Canlı Siparişler & POS", active: true }
      ]
    }
    if (pathname === "/panel/restaurant/menu") {
      return [
        { label: "Restaurant", active: false },
        { label: "Menü & Ürünler", active: true }
      ]
    }
    if (pathname === "/panel/restaurant/qr") {
      return [
        { label: "Restaurant", active: false },
        { label: "Masa & QR Kodları", active: true }
      ]
    }
    if (pathname.startsWith("/panel/cafe")) {
      return [{ label: "Konteynır Cafe", active: true }]
    }
    if (pathname.startsWith("/panel/club")) {
      return [{ label: "Club & Bar", active: true }]
    }
    if (pathname.startsWith("/panel/seafood")) {
      return [{ label: "Yalı Deniz Ürünleri", active: true }]
    }
    return [{ label: "Yönetim", active: true }]
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Trigger */}
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 rounded-xl hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="uppercase font-extrabold tracking-wider text-foreground/45">
            Yalı Paneli
          </span>
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={idx}>
              <span className="text-foreground/25">/</span>
              <span className={b.active ? "font-bold text-foreground" : "text-foreground/60 font-medium"}>
                {b.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 cursor-pointer" />}>
            <Globe className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border border-border shadow-lg">
            <DropdownMenuItem onClick={() => setLang('tr')} className="cursor-pointer font-medium text-xs">
              🇹🇷 Türkçe
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLang('en')} className="cursor-pointer font-medium text-xs">
              🇬🇧 English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Switcher */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9 rounded-full hover:bg-primary/10 cursor-pointer"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  )
}
