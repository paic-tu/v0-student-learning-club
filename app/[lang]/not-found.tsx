"use client"

import { Button } from "@/components/ui/button"
import { SearchX, Home, MoveLeft, MoveRight } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { StarfieldBackground } from "@/components/starfield-background"
import { GlowBlob } from "@/components/glow-blob"
import { NavBar } from "@/components/nav-bar"

export default function NotFound() {
  const pathname = usePathname()
  const router = useRouter()
  
  // Logic to determine language for localized not-found
  const language = pathname?.startsWith("/en") ? "en" : "ar"
  const isAr = language === "ar"

  return (
    <div className="min-h-screen relative flex flex-col" dir={isAr ? "rtl" : "ltr"}>
      {/* Unified Neon Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background opacity-80" />
        <StarfieldBackground className="opacity-80 dark:opacity-50" />
        <GlowBlob className="top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 opacity-45 dark:opacity-30" color="primary" size="600px" />
        <GlowBlob className="bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 opacity-40 dark:opacity-25" color="accent" size="500px" />
      </div>

      <NavBar />

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="text-center space-y-10 max-w-5xl w-full">
          {/* 404 Visual Container */}
          <div className="relative group">
            {/* Large Background Text with Neon Glow */}
            <h1 className="text-[150px] md:text-[280px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-primary via-primary/20 to-transparent select-none animate-pulse drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]">
              404
            </h1>
          </div>

          {/* Typography Section */}
          <div className="space-y-6 pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold tracking-wider uppercase">
              {isAr ? "خطأ في المسار" : "Route Error"}
            </div>
            
            <h2 className="text-4xl md:text-7xl font-black text-foreground tracking-tight leading-tight">
              {isAr ? "يبدو أنك تُهت في الفضاء الرقمي" : "Lost in the Digital Void"}
            </h2>
            
            <p className="text-muted-foreground text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed font-medium">
              {isAr 
                ? "الصفحة التي تبحث عنها غير موجودة. قد تكون تم نقلها أو لم تكن موجودة من الأساس."
                : "The coordinates you entered don't lead anywhere. This page might have been moved to another dimension."}
            </p>
          </div>

          {/* Premium Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-6">
            <Button 
              size="lg" 
              onClick={() => router.back()}
              className="h-16 md:h-20 px-10 md:px-14 bg-primary text-primary-foreground hover:opacity-90 transition-all duration-500 text-xl font-black rounded-[24px] flex items-center gap-4 shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:shadow-[0_0_50px_rgba(var(--primary),0.5)] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {isAr ? <MoveRight className="w-6 h-6 group-hover:translate-x-2 transition-transform relative z-10" /> : <MoveLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform relative z-10" />}
              <span className="relative z-10">{isAr ? "العودة للخلف" : "Go Back"}</span>
            </Button>

            <Link href={`/${language}`}>
              <Button 
                size="lg" 
                variant="outline"
                className="h-16 md:h-20 px-10 md:px-14 border-primary/30 bg-background/50 text-foreground hover:bg-primary/10 hover:border-primary/50 backdrop-blur-md transition-all duration-500 text-xl font-black rounded-[24px] flex items-center gap-4 group relative overflow-hidden"
              >
                <Home className="w-6 h-6 group-hover:scale-110 transition-transform text-primary" />
                <span>{isAr ? "الرئيسية" : "Home Portal"}</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Modern Tech Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
    </div>
  )
}
