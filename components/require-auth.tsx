"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const { language } = useLanguage()
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      setShowDialog(true)
    } else {
      setShowDialog(false)
    }
  }, [user, isLoading])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">{t("loading", language)}...</div>
  }

  if (!user) {
    return (
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تسجيل الدخول مطلوب" : "Login Required"}</DialogTitle>
            <DialogDescription>
              {language === "ar"
                ? "يجب تسجيل الدخول للوصول إلى هذه الصفحة"
                : "You must be logged in to access this page"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Link href="/auth/login" className="flex-1">
              <Button className="w-full">{t("login", language)}</Button>
            </Link>
            <Link href="/auth/register" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                {t("register", language)}
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return <>{children}</>
}
