"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShieldX } from "lucide-react"

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth()
  const { language } = useLanguage()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">{t("loading", language)}...</div>
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <ShieldX className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">{language === "ar" ? "غير مصرح بالوصول" : "Access Denied"}</h1>
          <p className="text-muted-foreground">
            {language === "ar"
              ? "ليس لديك صلاحية للوصول إلى لوحة الإدارة"
              : "You do not have permission to access the admin panel"}
          </p>
          <Link href="/">
            <Button>{language === "ar" ? "العودة للرئيسية" : "Back to Home"}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
