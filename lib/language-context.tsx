"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Language } from "./i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  dir: "rtl" | "ltr"
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language
    if (saved === "ar" || saved === "en") {
      setLanguageState(saved)
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
    document.documentElement.setAttribute("lang", lang)
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr")
  }

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("lang", language)
      document.documentElement.setAttribute("dir", language === "ar" ? "rtl" : "ltr")
    }
  }, [language, mounted])

  const dir = language === "ar" ? "rtl" : "ltr"

  return <LanguageContext.Provider value={{ language, setLanguage, dir }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
