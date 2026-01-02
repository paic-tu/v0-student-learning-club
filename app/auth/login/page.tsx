"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"
import { NavBar } from "@/components/nav-bar"
import { login } from "@/lib/auth"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setUser } = useAuth()
  const { language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, { en: string; ar: string }> = {
      EMAIL_NOT_FOUND: {
        en: "Email not found. Please check your email or sign up.",
        ar: "البريد الإلكتروني غير موجود. يرجى التحقق من بريدك أو التسجيل.",
      },
      INVALID_PASSWORD: {
        en: "Password is incorrect. Please try again.",
        ar: "كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.",
      },
      LOGIN_ERROR: {
        en: "An error occurred during login. Please try again.",
        ar: "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.",
      },
    }
    return errorMessages[errorCode]?.[language] || (language === "ar" ? "فشل تسجيل الدخول" : "Login failed")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await login(email, password)

      if (result.success && result.user) {
        setUser(result.user)
        toast({
          title: language === "ar" ? "تم تسجيل الدخول" : "Logged in successfully",
          description: language === "ar" ? "مرحباً بك في نيون" : "Welcome to Neon",
        })
        router.push("/")
      } else {
        const errorMessage = getErrorMessage(result.error || "LOGIN_ERROR")
        setError(errorMessage)
        console.log("[v0] Login failed with error code:", result.error)
      }
    } catch (error) {
      const errorMessage = language === "ar" ? "حدث خطأ أثناء تسجيل الدخول" : "An error occurred during login"
      setError(errorMessage)
      console.error("[v0] Login exception:", error)
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
                <Link href="/auth/register" className="text-primary hover:underline">
                  {t("register", language)}
                </Link>
              </p>

              <div className="pt-4 border-t text-sm text-muted-foreground">
                <p className="text-center font-medium mb-2">
                  {language === "ar" ? "حسابات تجريبية:" : "Demo accounts:"}
                </p>
                <div className="space-y-1 text-xs">
                  <p>
                    <strong>{language === "ar" ? "طالب:" : "Student:"}</strong> student@neon.edu / password
                  </p>
                  <p>
                    <strong>{language === "ar" ? "مدرس:" : "Instructor:"}</strong> instructor@neon.edu / password
                  </p>
                  <p>
                    <strong>{language === "ar" ? "مدير:" : "Admin:"}</strong> admin@neon.edu / password
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
