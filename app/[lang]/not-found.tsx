"use client"

import { Button } from "@/components/ui/button"
import { SearchX, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export default function NotFound() {
  const pathname = usePathname()
  const router = useRouter()
  const language = pathname?.startsWith("/en") ? "en" : "ar"
  const isAr = language === "ar"

  return (
    <div className="dark min-h-screen w-full flex items-center justify-center bg-background text-foreground overflow-hidden relative font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative z-10 text-center space-y-8 px-4">
        {/* 404 Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-6 bg-accent/10 rounded-full ring-1 ring-accent/20 drop-shadow-[0_0_15px_var(--accent)]">
            <SearchX className="h-20 w-20 text-accent animate-bounce" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1 className="text-[100px] md:text-[150px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 select-none">
            404
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            {isAr ? "الصفحة غير موجودة" : "Page Not Found"}
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto leading-relaxed">
            {isAr 
              ? "يبدو أنك ضللت الطريق في الفضاء الرقمي. الصفحة التي تبحث عنها قد اختفت أو تم نقلها."
              : "Looks like you've got lost in the digital space. The page you're looking for has vanished or been moved."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button 
            size="lg" 
            onClick={() => router.back()}
            className="h-12 px-8 bg-white text-slate-900 hover:bg-slate-200 transition-all duration-300 text-lg font-bold rounded-xl flex items-center gap-2"
          >
            <ArrowLeft className={isAr ? "rotate-180 w-5 h-5" : "w-5 h-5"} />
            {isAr ? "العودة للخلف" : "Go Back"}
          </Button>

          <Link href={`/${language}`} className="group">
            <Button 
              size="lg" 
              variant="outline"
              className="h-12 px-8 border-slate-800 text-white hover:bg-slate-900 transition-all duration-300 text-lg font-bold rounded-xl flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              {isAr ? "الرئيسية" : "Home Page"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
    </div>
  )
}

