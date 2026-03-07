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
          <div className="flex justify-center gap-4 text-sm text-muted-foreground mt-4 flex-wrap">
            <a href={`/${language}/privacy`} className="hover:text-primary transition-colors">
              {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
            </a>
            <a href={`/${language}/terms`} className="hover:text-primary transition-colors">
              {isAr ? "شروط الاستخدام" : "Terms of Use"}
            </a>
            <a href={`/${language}/content-policy`} className="hover:text-primary transition-colors">
              {isAr ? "سياسة المحتوى" : "Content Policy"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
