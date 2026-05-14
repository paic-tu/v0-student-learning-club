"use client"

import { Button } from "@/components/ui/button"
import { SearchX, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export default function RootNotFound() {
  const pathname = usePathname()
  const router = useRouter()
  
  // Logic to determine language for root not-found
  const language = pathname?.startsWith("/en") ? "en" : "ar"
  const isAr = language === "ar"

  return (
    <div className="dark min-h-screen w-full flex items-center justify-center bg-[#020617] text-foreground overflow-hidden relative font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,112,243,0.1),transparent_50%)]" />
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 text-center space-y-12 px-4 max-w-4xl">
        {/* Animated 404 Header */}
        <div className="relative inline-block">
          <h1 className="text-[120px] md:text-[220px] font-[900] leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/5 select-none opacity-20">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="p-8 bg-blue-600/10 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                <SearchX className="h-24 w-24 md:h-32 md:w-32 text-blue-500 animate-pulse" />
             </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-6">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
            {isAr ? "تُهت في الفضاء؟" : "Lost in Space?"}
          </h2>
          <p className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed font-medium">
            {isAr 
              ? "الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها إلى مجرة أخرى."
              : "The page you're looking for doesn't exist or might have been moved to another galaxy."}
          </p>
        </div>

        {/* Premium Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
          <Button 
            size="lg" 
            onClick={() => router.back()}
            className="h-16 px-10 bg-white text-black hover:bg-slate-200 transition-all duration-300 text-xl font-black rounded-2xl flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            <ArrowLeft className={isAr ? "rotate-180 w-6 h-6" : "w-6 h-6"} />
            {isAr ? "العودة للخلف" : "Go Back"}
          </Button>

          <Link href={`/${language}`}>
            <Button 
              size="lg" 
              variant="outline"
              className="h-16 px-10 border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md transition-all duration-300 text-xl font-black rounded-2xl flex items-center gap-3"
            >
              <Home className="w-6 h-6" />
              {isAr ? "الرئيسية" : "Home Page"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Modern Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
    </div>
  )
}
