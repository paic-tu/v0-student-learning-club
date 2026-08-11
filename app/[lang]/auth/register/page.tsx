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
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"

import { Checkbox } from "@/components/ui/checkbox"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedPolicy, setAgreedPolicy] = useState(false)
  const [loading, setLoading] = useState(false)
  const { language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (!agreedTerms || !agreedPolicy) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يجب الموافقة على جميع الشروط والسياسات" : "You must agree to all terms and policies",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append("name", name)
    formData.append("email", email)
    formData.append("password", password)
    formData.append("phoneNumber", phoneNumber)

    try {
      const result = await registerAction(formData)

      if (result.success) {
        // Auto login after registration
        const loginFormData = new FormData()
        loginFormData.append("email", email)
        loginFormData.append("password", password)
        loginFormData.append("redirectTo", `/${language}`)
        
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
          // Force hard navigation to ensure session is picked up
          window.location.href = `/${language}`
        }
      } else {
        let errorMessage = result.error
        if (language === "ar") {
          if (result.error === "Email already registered") errorMessage = "البريد الإلكتروني مسجل مسبقاً"
          else if (result.error === "Missing required fields") errorMessage = "يرجى ملء جميع الحقول المطلوبة"
          else if (result.error === "Invalid input format") errorMessage = "تنسيق البيانات غير صحيح"
          else if (result.error?.includes("Service unavailable") || result.error?.includes("quota exceeded")) errorMessage = "الخدمة غير متوفرة: تجاوز الحد المسموح لنقل البيانات"
          else errorMessage = "فشل إنشاء الحساب"
        }

        toast({
          title: language === "ar" ? "خطأ" : "Error",
          description: errorMessage || (language === "ar" ? "فشل إنشاء الحساب" : "Registration failed"),
          variant: "destructive",
        })
      }
    } catch (error: any) {
      if (error.message === "NEXT_REDIRECT" || error.digest?.startsWith("NEXT_REDIRECT")) {
        toast({
          title: language === "ar" ? "تم إنشاء الحساب" : "Account created",
          description: language === "ar" ? "مرحباً بك في نيون" : "Welcome to Neon",
        })
        // Force hard navigation here as well
        window.location.href = `/${language}/dashboard`
        return
      }
      console.error("Client registration error:", error)
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
    <div className="relative z-10 min-h-screen overflow-hidden text-slate-900 dark:text-slate-100">
      <NavBar />
      <div className="flex min-h-[calc(100vh-5rem)] items-start justify-center px-3 pt-64 pb-7 sm:px-6 sm:pt-24 sm:pb-8 lg:px-8 lg:pt-28">
        <Card className="w-full max-w-sm overflow-hidden rounded-2xl border border-primary/20 bg-white/95 text-slate-900 shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_20px_45px_rgba(109,40,217,0.16)] dark:border-primary/30 dark:bg-slate-900/95 dark:text-slate-100 sm:max-w-md lg:max-w-xl">
          <CardHeader className="space-y-2 px-5 pb-4 pt-7 text-center sm:px-8 sm:pt-8">
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t("register", language)}</CardTitle>
            <CardDescription className="text-slate-700 dark:text-slate-300">{language === "ar" ? "أنشئ حسابك الجديد" : "Create your new account"}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-7 sm:px-8 sm:pb-8">
            <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-900 dark:text-slate-100">{t("name", language)}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={language === "ar" ? "الاسم الكامل" : "Full name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-900 dark:text-slate-100">{t("email", language)}</Label>
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

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-foreground">{language === "ar" ? "رقم الهاتف" : "Phone Number"}</Label>
                <div dir="ltr">
                  <PhoneInput
                    id="phoneNumber"
                    international
                    defaultCountry="SA"
                    value={phoneNumber}
                    onChange={(value) => setPhoneNumber(value || "")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-900 dark:text-slate-100">{t("password", language)}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950"
                />
                <p className="text-xs text-foreground/70">
                  {language === "ar" ? "6 أحرف على الأقل" : "At least 6 characters"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-900 dark:text-slate-100">{language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="terms"
                    checked={agreedTerms}
                    onCheckedChange={(checked) => setAgreedTerms(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {language === "ar" ? "أوافق على " : "I agree to "}
                      <Link href={`/${language}/terms`} className="text-primary hover:underline" target="_blank">
                        {language === "ar" ? "شروط الاستخدام" : "Terms of Use"}
                      </Link>
                      {language === "ar" ? " و " : " and "}
                      <Link href={`/${language}/privacy`} className="text-primary hover:underline" target="_blank">
                        {language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
                      </Link>
                    </label>
                  </div>
                </div>

                <div className="flex items-start space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id="policy"
                    checked={agreedPolicy}
                    onCheckedChange={(checked) => setAgreedPolicy(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="policy"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {language === "ar" ? "أوافق على " : "I agree to "}
                      <Link href={`/${language}/content-policy`} className="text-primary hover:underline" target="_blank">
                        {language === "ar" ? "سياسة المحتوى" : "Content Policy"}
                      </Link>
                    </label>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full font-semibold" disabled={loading}>
                {loading ? "..." : t("register", language)}
              </Button>

              <p className="text-center text-sm text-slate-700 dark:text-slate-300">
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
