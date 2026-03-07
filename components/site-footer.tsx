"use client"

import { useLanguage } from "@/lib/language-context"

export function SiteFooter() {
  const { language } = useLanguage()
  const isAr = language === "ar"

  return (
    <footer className="border-t py-12 bg-muted/30 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {isAr ? "نيون" : "Neon"}
          </div>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "© 2025 Neon | نيون التعليمية. جميع الحقوق محفوظة."
              : "© 2025 Neon Educational Platform. All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  )
}
