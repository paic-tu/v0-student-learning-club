"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"
import { NavBar } from "@/components/nav-bar"
import { signIn } from "next-auth/react"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(language === "ar" ? "فشل تسجيل الدخول" : "Login failed")
        console.error("Login failed:", result.error)
      } else {
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
