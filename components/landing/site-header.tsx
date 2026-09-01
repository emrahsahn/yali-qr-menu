"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useLanguage } from "@/lib/context/language-context"
import { Button } from "@/components/ui/button"
import { Globe, Sun, Moon, Menu, X, UtensilsCrossed } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useLanguage()
  const pathname = usePathname()

  // Do not show header on customer order pages
  if (pathname.includes('/table/')) {
    return null
  }

  const navItems = [
    { name: t('landing.venues.cafe.name'), href: "/cafe" },
    { name: t('landing.venues.restaurant.name'), href: "/restaurant" },
    { name: t('landing.venues.club.name'), href: "/club" },
    { name: t('landing.venues.seafood.name'), href: "/seafood" },
  ]

  const isCurrent = (href: string) => pathname === href

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/20 dark:border-black/20 glass-panel shadow-sm transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary/10 p-2 rounded-full border border-primary/20 group-hover:scale-105 transition-all">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>
          <span className="font-heading font-black text-xl tracking-wider text-primary">
            YALI
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-semibold transition-all duration-200 hover:text-primary ${
                isCurrent(item.href)
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-foreground/75"
              }`}
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="/dev-portal"
            className={`text-xs uppercase tracking-wider font-bold opacity-60 hover:opacity-100 hover:text-primary transition-all ${
              isCurrent('/dev-portal') ? "text-primary opacity-100" : ""
            }`}
          >
            {t('landing.nav.devPortal')}
          </Link>
        </nav>

        {/* Desktop Utilities */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10" />}>
              <Globe className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-slate-950 border border-border shadow-lg">
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
            className="h-9 w-9 rounded-full hover:bg-primary/10"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Login Button */}
          <Link href="/login">
            <Button variant="outline" className="rounded-full font-bold text-xs uppercase px-4 py-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary transition-all cursor-pointer">
              {lang === 'tr' ? 'Giriş' : 'Login'}
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Buttons */}
        <div className="flex md:hidden items-center gap-2">
          {/* Language Selector for Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" />}>
              <Globe className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-slate-950 border border-border shadow-lg">
              <DropdownMenuItem onClick={() => setLang('tr')} className="cursor-pointer text-xs font-semibold">
                🇹🇷 Türkçe
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLang('en')} className="cursor-pointer text-xs font-semibold">
                🇬🇧 English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle for Mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9 rounded-full"
          >
            <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Hamburger Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 dark:border-black/10 bg-background/95 backdrop-blur-md px-4 py-4 flex flex-col gap-4 animate-fade-in">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-semibold p-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-all ${
                isCurrent(item.href) ? "text-primary bg-primary/5" : "text-foreground/80"
              }`}
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="/dev-portal"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-xs uppercase tracking-wider font-bold p-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-all opacity-80 ${
              isCurrent('/dev-portal') ? "text-primary bg-primary/5 opacity-100" : ""
            }`}
          >
            ⚙️ {t('landing.nav.devPortal')}
          </Link>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs uppercase tracking-wider font-bold p-3 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-primary bg-primary/5 border border-primary/20 text-center"
          >
            🔑 {lang === 'tr' ? 'Giriş Yap' : 'Login'}
          </Link>
        </div>
      )}
    </header>
  )
}
