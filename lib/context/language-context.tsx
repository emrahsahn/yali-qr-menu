"use client"

import React, { createContext, useCallback, useContext, useSyncExternalStore } from "react"
import { translations, Language } from "@/lib/i18n/translations"

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

type Dict = Record<string, unknown>;

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
  return localStorage.getItem(LANG_KEY) === "en" ? "en" : "tr";
}

function getServerLangSnapshot(): Language {
  return "tr";
}

// Resolves a flat key or dot-separated key against dictionary.
function resolveTranslation(source: unknown, key: string): string | undefined {
  if (!source || typeof source !== "object") return undefined;

  // 1. Direct flat key match first (e.g. "panel.cafe.title", "menu", "landing.hero.title")
  if (key in (source as Dict)) {
    const val = (source as Dict)[key];
    return val === undefined ? undefined : String(val);
  }

  // 2. Nested traversal fallback (e.g. source["panel"]["cafe"]["title"])
  let node: unknown = source;
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in (node as Dict)) {
      node = (node as Dict)[part];
    } else {
      return undefined;
    }
  }
  return node === undefined ? undefined : String(node);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribeLang, getLangSnapshot, getServerLangSnapshot);

  const setLang = useCallback((newLang: Language) => {
    localStorage.setItem(LANG_KEY, newLang);
    // Native 'storage' events only fire across tabs, so notify same-tab subscribers too:
    window.dispatchEvent(new Event(LANG_EVENT));
    // Kept for legacy listeners that react to the generic storage event.
    window.dispatchEvent(new Event("storage"));
  }, []);

  const t = useCallback((key: string): string => {
    return (
      resolveTranslation(translations[lang], key) ??
      resolveTranslation(translations["tr"], key) ??
      key
    );
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    return {
      lang: "tr" as Language,
      setLang: () => {},
      t: (key: string) => resolveTranslation(translations["tr"], key) ?? key,
    };
  }
  return context;
}
