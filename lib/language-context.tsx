"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { Language } from "./i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  dir: "rtl" | "ltr"
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ 
  children, 
  defaultLang = "ar" 
}: { 
  children: ReactNode
  defaultLang?: Language 
}) {
  const [language, setLanguageState] = useState<Language>(defaultLang)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setLanguageState(defaultLang)
  }, [defaultLang])

  const setLanguage = (lang: Language) => {
    if (lang === language) return
    
    // Replace locale in path
    // Path is like /ar/some/path or /ar
    const segments = pathname.split('/')
    // segments[0] is empty string
    // segments[1] is locale
    if (segments.length > 1) {
      segments[1] = lang
      const newPath = segments.join('/')
      router.push(newPath)
    } else {
      // Should not happen in [lang] route but fallback
      router.push(`/${lang}`)
    }
  }

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
