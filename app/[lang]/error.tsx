"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, RefreshCcw } from "lucide-react"
import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname()
  const language = pathname?.startsWith("/en") ? "en" : "ar"
  const isAr = language === "ar"

  useEffect(() => {
    console.error("[v0] Error:", error)
  }, [error])

  return (
    <div className="dark min-h-screen w-full flex items-center justify-center bg-background text-foreground overflow-hidden relative font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-destructive/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative z-10 text-center space-y-8 px-4">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-6 bg-destructive/10 rounded-full ring-1 ring-destructive/20 drop-shadow-[0_0_15px_var(--destructive)]">
            <AlertTriangle className="h-20 w-20 text-destructive animate-pulse" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
            {isAr ? "حدث خطأ غير متوقع" : "Something went wrong"}
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto leading-relaxed">
            {isAr 
              ? "نعتذر عن هذا الخلل. لقد حدث خطأ أثناء محاولة عرض هذه الصفحة."
              : "We apologize for the inconvenience. An error occurred while trying to render this page."}
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-muted-foreground/40 mt-4">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button 
            size="lg" 
            onClick={reset}
            className="h-12 px-8 bg-white text-slate-900 hover:bg-slate-200 transition-all duration-300 text-lg font-bold rounded-xl flex items-center gap-2"
          >
            <RefreshCcw className="w-5 h-5" />
            {isAr ? "حاول مرة أخرى" : "Try Again"}
          </Button>

          <Link href={`/${language}`} className="group">
            <Button 
              size="lg" 
              variant="outline"
              className="h-12 px-8 border-slate-800 text-white hover:bg-slate-900 transition-all duration-300 text-lg font-bold rounded-xl flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              {isAr ? "العودة للرئيسية" : "Back to Home"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
    </div>
  )
}
