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
import { registerAction, loginAction } from "@/lib/actions/auth"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    formData.append("name", name)
    formData.append("email", email)
    formData.append("password", password)

    try {
      const result = await registerAction(formData)

      if (result.success) {
        // Auto login after registration
        const loginFormData = new FormData()
        loginFormData.append("email", email)
        loginFormData.append("password", password)
        
        const loginResult = await loginAction(undefined, loginFormData)

        if (loginResult?.error) {
           toast({
            title: language === "ar" ? "تم إنشاء الحساب" : "Account created",
            description: language === "ar" ? "يرجى تسجيل الدخول" : "Please sign in",
          })
          router.push(`/${language}/auth/login`)
        } else {
          toast({
            title: language === "ar" ? "تم إنشاء الحساب" : "Account created",
            description: language === "ar" ? "مرحباً بك في نيون" : "Welcome to Neon",
          })
          router.push(`/${language}/dashboard`)
          router.refresh()
        }
      } else {
        toast({
          title: language === "ar" ? "خطأ" : "Error",
          description: result.error || (language === "ar" ? "فشل إنشاء الحساب" : "Registration failed"),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "حدث خطأ أثناء إنشاء الحساب" : "An error occurred during registration",
        variant: "destructive",
      })
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
            <CardTitle className="text-3xl font-bold">{t("register", language)}</CardTitle>
            <CardDescription>{language === "ar" ? "أنشئ حسابك الجديد" : "Create your new account"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name", language)}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={language === "ar" ? "الاسم الكامل" : "Full name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

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
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  {language === "ar" ? "6 أحرف على الأقل" : "At least 6 characters"}
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "..." : t("register", language)}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {language === "ar" ? "لديك حساب بالفعل؟ " : "Already have an account? "}
                <Link href={`/${language}/auth/login`} className="text-primary hover:underline">
                  {t("login", language)}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
