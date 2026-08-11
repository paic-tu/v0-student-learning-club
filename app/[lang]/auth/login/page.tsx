"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"
import { NavBar } from "@/components/nav-bar"
import { loginAction } from "@/lib/actions/auth"
import { AlertCircle } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { language } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const err = searchParams.get("error")
    if (!err) return
    const msg =
      err === "Configuration"
        ? language === "ar"
          ? "يوجد خطأ في إعدادات تسجيل الدخول. تأكد من متغيرات البيئة."
          : "There is a configuration issue. Please check environment variables."
        : language === "ar"
        ? "فشل تسجيل الدخول"
        : "Login failed"
    setError(msg)
  }, [language, searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)
      const callbackUrl = searchParams.get("callbackUrl") || `/${language}`
      formData.append("redirectTo", callbackUrl)
      
      const result = await loginAction(undefined, formData)

      if (result?.error) {
        let msg = ""
        if (result.error === "Invalid credentials.") {
          msg = language === "ar" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password"
        } else {
          msg = language === "ar" ? "فشل تسجيل الدخول" : "Login failed"
        }
        setError(msg)
        console.error("Login failed:", result.error)
      } else {
        // If no error, force redirect manually
        window.location.href = callbackUrl
      }
    } catch (error: any) {
      if (error.message === "NEXT_REDIRECT" || error.digest?.startsWith("NEXT_REDIRECT")) {
        // Force hard navigation if redirect is thrown
        const callbackUrl = searchParams.get("callbackUrl") || `/${language}`
        window.location.href = callbackUrl
        return
      }
      const errorMessage = language === "ar" ? "حدث خطأ أثناء تسجيل الدخول" : "An error occurred during login"
      setError(errorMessage)
      console.error("Login exception:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative z-10 min-h-screen overflow-hidden text-slate-900 dark:text-slate-100">
      <NavBar />
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md overflow-hidden rounded-2xl border border-primary/20 bg-white/95 text-slate-900 shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_20px_45px_rgba(109,40,217,0.16)] dark:border-primary/30 dark:bg-slate-900/95 dark:text-slate-100">
          <CardHeader className="space-y-2 px-6 pb-4 pt-8 text-center sm:px-8">
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t("login", language)}</CardTitle>
            <CardDescription className="text-slate-700 dark:text-slate-300">
              {language === "ar" ? "أدخل بريدك الإلكتروني وكلمة المرور" : "Enter your email and password"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8 sm:px-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-900 dark:text-slate-100">{t("email", language)}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={language === "ar" ? "البريد الإلكتروني" : "Email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-900 dark:text-slate-100">{t("password", language)}</Label>
                  <Link
                    href={`/${language}/auth/forgot-password`}
                    className="text-sm text-primary hover:underline"
                  >
                    {language === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?"}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950"
                />
              </div>

              <Button type="submit" className="w-full rounded-xl py-2.5 font-semibold" disabled={loading}>
                {loading ? "..." : t("login", language)}
              </Button>

              <p className="text-center text-sm text-slate-700 dark:text-slate-300">
                {language === "ar" ? "ليس لديك حساب؟ " : "Don't have an account? "}
                <Link href={`/${language}/auth/register`} className="text-primary hover:underline">
                  {t("register", language)}
                </Link>
              </p>
 
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
