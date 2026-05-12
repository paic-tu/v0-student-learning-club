"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { resetPasswordAction } from "@/lib/actions/auth"
import { NavBar } from "@/components/nav-bar"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { language } = useLanguage()
  const token = searchParams.get("token")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "رمز التحقق مفقود" : "Verification token is missing",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("token", token)
      formData.append("password", password)
      formData.append("confirmPassword", confirmPassword)

      const result = await resetPasswordAction(formData)

      if (result.success) {
        toast({
          title: language === "ar" ? "تم بنجاح" : "Success",
          description: language === "ar" 
            ? "تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول."
            : "Password reset successfully. You can now log in.",
        })
        router.push(`/${language}/auth/login`)
      } else {
        toast({
          title: language === "ar" ? "خطأ" : "Error",
          description: result.error || (language === "ar" ? "حدث خطأ ما" : "Something went wrong"),
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "حدث خطأ في الاتصال بالخادم" : "Connection error",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <NavBar />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="w-full max-w-md border-destructive">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">
                {language === "ar" ? "رابط غير صالح" : "Invalid Link"}
              </CardTitle>
              <CardDescription>
                {language === "ar" 
                  ? "عذراً، رابط إعادة تعيين كلمة المرور غير صالح أو مفقود."
                  : "Sorry, the password reset link is invalid or missing."}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <NavBar />
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle>{language === "ar" ? "تعيين كلمة مرور جديدة" : "Set New Password"}</CardTitle>
            <CardDescription>
              {language === "ar" 
                ? "أدخل كلمة المرور الجديدة الخاصة بك أدناه"
                : "Enter your new password below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  placeholder={language === "ar" ? "كلمة المرور الجديدة" : "New Password"} 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input 
                  placeholder={language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"} 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full h-11" disabled={loading}>
                {loading ? "..." : (language === "ar" ? "تحديث كلمة المرور" : "Update Password")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
