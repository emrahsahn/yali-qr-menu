"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useSyncExternalStore } from "react"
import { CartItem, OrderSession, Product, Category } from "@/lib/types/database"
import { translations, Language } from "@/lib/i18n/translations"

interface TableContextType {
  tableId: string;
  token: string;
  lang: Language;
  setLang: (lang: Language) => void;
  session: OrderSession | null;
  cartItems: CartItem[];
  categories: Category[];
  products: Product[];
  isLoading: boolean;
  /* 
   * SİPARİŞ & GARSON ÖZELLİKLERİ (İleride kolayca açılmak üzere güvenle deaktive edildi):
   */
  addToCart: (productId: string, adet: number, notText?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateCartItemAdet: (itemId: string, adet: number) => Promise<void>;
  confirmOrder: () => Promise<void>;
  callWaiter: () => void;
  reloadMenu: () => Promise<void>;
  t: (key: keyof typeof translations['tr']) => string;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

const LANG_KEY = "yali_lang";
const LANG_EVENT = "yali_lang_change";

function subscribeLang(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LANG_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LANG_EVENT, onChange);
  };
}

function getLangSnapshot(): Language {
  if (typeof window === "undefined") return "tr";
  return localStorage.getItem(LANG_KEY) === "en" ? "en" : "tr";
}

function getServerLangSnapshot(): Language {
  return "tr";
}

export function TableProvider({
  children,
  tableId = "default-restaurant",
  token = "token-qr",
  initialCategories = [],
  initialProducts = []
}: {
  children: React.ReactNode;
  tableId?: string;
  token?: string;
  initialCategories?: Category[];
  initialProducts?: Product[];
}) {
  const [session] = useState<OrderSession | null>(null);
  const [cartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0 && initialCategories.length === 0);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const lang = useSyncExternalStore(subscribeLang, getLangSnapshot, getServerLangSnapshot);

  const setLang = useCallback((newLang: Language) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LANG_KEY, newLang);
      window.dispatchEvent(new Event(LANG_EVENT));
      window.dispatchEvent(new Event("storage"));
    }
  }, []);

  const t = (key: keyof typeof translations['tr']) => {
    return translations[lang]?.[key] || translations['tr'][key] || String(key);
  };

  // Live menu sync from Next.js server API
  const reloadMenu = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" })
      ]);

      if (prodRes.ok && catRes.ok) {
        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (prodData.products && Array.isArray(prodData.products)) {
          setProducts(prodData.products);
        }
        if (catData.categories && Array.isArray(catData.categories)) {
          setCategories(catData.categories);
        }
      }
    } catch (e) {
      console.warn("Notice: Live menu sync fetch error, using local state:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      reloadMenu();
    });

    // Auto-sync polling every 5 seconds for multi-device real-time updates
    const pollInterval = setInterval(() => {
      if (active) reloadMenu();
    }, 5000);

    // Listen to local window broadcast events for instant same-browser updates
    const handleMenuEvent = () => reloadMenu();
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("yali_menu_events");
      bc.onmessage = () => reloadMenu();
    } catch {}

    window.addEventListener("yali_menu_updated", handleMenuEvent);
    window.addEventListener("focus", handleMenuEvent);

    return () => {
      active = false;
      clearInterval(pollInterval);
      window.removeEventListener("yali_menu_updated", handleMenuEvent);
      window.removeEventListener("focus", handleMenuEvent);
      if (bc) bc.close();
    };
  }, [reloadMenu]);

  /* 
   * DEAKTİVE EDİLEN SİPARİŞ & GARSON METOTLARI
   * (Gerektiğinde tek satırla tekrar kullanılmak üzere fonksiyon imzaları korundu)
   */
  const addToCart = async (_productId: string, _adet: number, _notText?: string) => {
    // Sipariş sistemi deaktive edildi (İleride açılabilir)
  };

  const removeFromCart = async (_itemId: string) => {
    // Sepet sistemi deaktive edildi (İleride açılabilir)
  };

  const updateCartItemAdet = async (_itemId: string, _adet: number) => {
    // Sepet sistemi deaktive edildi (İleride açılabilir)
  };

  const confirmOrder = async () => {
    // Mutfak onay akışı deaktive edildi (İleride açılabilir)
  };

  const callWaiter = () => {
    // Garson çağırma sistemi deaktive edildi (İleride açılabilir)
  };

  return (
    <TableContext.Provider
      value={{
        tableId,
        token,
        lang,
        setLang,
        session,
        cartItems,
        categories,
        products,
        isLoading,
        addToCart,
        removeFromCart,
        updateCartItemAdet,
        confirmOrder,
        callWaiter,
        reloadMenu,
        t
      }}
    >
      {children}
    </TableContext.Provider>
  );
}

export function useTable() {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error("useTable must be used within a TableProvider");
  }
  return context;
}
