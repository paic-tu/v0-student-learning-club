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
      
      const result = await loginAction(undefined, formData)

      if (result?.error) {
        const msg =
          result.error === "Invalid credentials."
            ? language === "ar"
              ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
              : "Invalid email or password"
            : language === "ar"
            ? "فشل تسجيل الدخول"
            : "Login failed"
        setError(msg)
        console.error("Login failed:", result.error)
      } else if (result?.success) {
        toast({
          title: language === "ar" ? "تم تسجيل الدخول" : "Logged in successfully",
          description: language === "ar" ? "مرحباً بك في نيون" : "Welcome to Neon",
        })
        router.push(`/${language}/dashboard`)
        router.refresh()
      }
    } catch (error) {
      const errorMessage = language === "ar" ? "حدث خطأ أثناء تسجيل الدخول" : "An error occurred during login"
      setError(errorMessage)
      console.error("Login exception:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <NavBar />
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">{t("login", language)}</CardTitle>
            <CardDescription>
              {language === "ar" ? "أدخل بريدك الإلكتروني وكلمة المرور" : "Enter your email and password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t("email", language)}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={language === "ar" ? "البريد الإلكتروني" : "Email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("password", language)}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "..." : t("login", language)}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
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
