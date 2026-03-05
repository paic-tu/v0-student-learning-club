"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { usePathname } from "next/navigation"

export default function NotFound() {
  const pathname = usePathname()
  // Default to 'ar' unless 'en' is detected
  const language = pathname?.startsWith("/en") ? "en" : "ar"

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <FileQuestion className="h-20 w-20 mx-auto text-muted-foreground" />
        <h1 className="text-4xl font-bold">404</h1>
        <h2 className="text-2xl font-semibold">{language === "ar" ? "الصفحة غير موجودة" : "Page Not Found"}</h2>
        <p className="text-muted-foreground">
          {language === "ar"
            ? "عذراً، الصفحة التي تبحث عنها غير موجودة"
            : "Sorry, the page you're looking for doesn't exist"}
        </p>
        <Link href="/">
          <Button size="lg">{language === "ar" ? "العودة للرئيسية" : "Back to Home"}</Button>
        </Link>
      </div>
    </div>
  )
}
