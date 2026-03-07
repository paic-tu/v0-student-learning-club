"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function NotFound() {
  const pathname = usePathname()
  // Default to 'ar' unless 'en' is detected
  const language = pathname?.startsWith("/en") ? "en" : "ar"
  const isAr = language === "ar"

  return (
    <div className="dark min-h-screen w-full flex items-center justify-center bg-background text-foreground overflow-hidden relative font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative z-10 text-center space-y-8 px-4">
        {/* Neon 404 */}
        <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 drop-shadow-[0_0_30px_var(--primary)] animate-pulse select-none">
          404
        </h1>
        
        {/* Neon Message */}
        <div className="space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-accent drop-shadow-[0_0_10px_var(--accent)]">
            {isAr ? "الصفحة غير موجودة" : "Page Not Found"}
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto leading-relaxed">
            {isAr 
              ? "يبدو أنك ضللت الطريق في الفضاء الرقمي. الصفحة التي تبحث عنها قد اختفت."
              : "Looks like you've got lost in the digital space. The page you're looking for has vanished."}
          </p>
        </div>

        {/* Neon Button */}
        <Link href={`/${language}`} className="inline-block group pt-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <Button 
              size="lg" 
              className="relative h-12 px-8 bg-background border border-border text-foreground hover:bg-card hover:text-accent transition-all duration-300 text-lg font-medium"
            >
              {isAr ? "العودة للرئيسية" : "Back to Home"}
            </Button>
          </div>
        </Link>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
    </div>
  )
}
