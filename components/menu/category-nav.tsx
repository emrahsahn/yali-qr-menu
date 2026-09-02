"use client"

import React from "react"
import { useTable } from "@/lib/context/table-context"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Globe, Sun, Moon, Search } from "lucide-react"
import { YaliLogo } from "@/components/ui/yali-logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/*
 * DEAKTİVE EDİLEN BİLEŞENLER (Garson çağırma - gerektiğinde açılmak üzere korundu):
 * import { BellRing, CheckCircle } from "lucide-react"
 * import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
 */

export function CategoryNav({
  activeCategory,
  onCategoryChange,
  isSearchOpen,
  onToggleSearch
}: {
  activeCategory: string | null;
  onCategoryChange: (id: string) => void;
  isSearchOpen?: boolean;
  onToggleSearch?: () => void;
}) {
  const { categories, lang, setLang } = useTable();
  const { theme, setTheme } = useTheme();

  return (
    <div className="sticky top-0 z-30 w-full flex flex-col glass-panel border-b border-border shadow-md bg-card/95 backdrop-blur-md">
      {/* Top utility row */}
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-2.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <YaliLogo size="xs" shadow />
          <span className="font-heading font-black text-base sm:text-lg tracking-wider text-primary">YALI</span>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Search Toggle Button */}
          {onToggleSearch && (
            <Button
              variant={isSearchOpen ? "default" : "ghost"}
              size="icon"
              onClick={onToggleSearch}
              className={`h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-full border transition-all cursor-pointer ${
                isSearchOpen
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "border-border text-foreground/80 hover:text-primary hover:border-primary/40 hover:bg-primary/10"
              }`}
              title={lang === 'tr' ? "Menüde Ara" : "Search Menu"}
            >
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}

          {/*
           * DEAKTİVE EDİLEN GARSON ÇAĞIRMA BUTONU (İleride açılabilir):
           * <Button variant="ghost" size="icon" onClick={handleOpenConfirm} className="...">
           *   <BellRing className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-bounce" />
           * </Button>
           */}

          {/* Language Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-full border border-border cursor-pointer" />}>
              <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground/80" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card text-foreground border border-border shadow-xl rounded-2xl">
              <DropdownMenuItem onClick={() => setLang('tr')} className="cursor-pointer font-semibold">
                🇹🇷 Türkçe
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLang('en')} className="cursor-pointer font-semibold">
                🇬🇧 English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Switcher */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8.5 w-8.5 sm:h-9 sm:w-9 rounded-full border border-border cursor-pointer"
          >
            <Sun className="h-[1.1rem] w-[1.1rem] sm:h-[1.2rem] sm:w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
            <Moon className="absolute h-[1.1rem] w-[1.1rem] sm:h-[1.2rem] sm:w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-amber-300" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>

      {/* Categories horizontal scroll row */}
      <div className="flex w-full items-center overflow-x-auto no-scrollbar py-2.5 sm:py-3 px-3 sm:px-4 gap-1.5 sm:gap-2 scroll-smooth">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          const ad = lang === 'tr' ? category.ad_tr : category.ad_en;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex-shrink-0 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]"
                  : "bg-secondary/70 dark:bg-[#1E1711] border border-border hover:bg-secondary text-foreground/75 hover:text-foreground"
              }`}
            >
              {ad}
            </button>
          );
        })}
      </div>
    </div>
  );
}
