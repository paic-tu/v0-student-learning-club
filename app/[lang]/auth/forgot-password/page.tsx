
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { NavBar } from "@/components/nav-bar"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { language } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: language === "ar" ? "تم الإرسال" : "Sent",
      description: language === "ar" 
        ? "إذا كان البريد الإلكتروني مسجلاً لدينا، سيتم إرسال رابط إعادة تعيين كلمة المرور."
        : "If the email is registered, a password reset link has been sent.",
    })
    
    setLoading(false)
    setEmail("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <NavBar />
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{language === "ar" ? "نسيت كلمة المرور" : "Forgot Password"}</CardTitle>
            <CardDescription>
              {language === "ar" 
                ? "أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور"
                : "Enter your email to reset your password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                placeholder={language === "ar" ? "البريد الإلكتروني" : "Email"} 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button className="w-full" disabled={loading}>
                {loading ? "..." : (language === "ar" ? "إرسال رابط إعادة التعيين" : "Send Reset Link")}
              </Button>
              <div className="text-center text-sm">
                <Link href={`/${language}/auth/login`} className="text-primary hover:underline">
                  {language === "ar" ? "العودة لتسجيل الدخول" : "Back to Login"}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
