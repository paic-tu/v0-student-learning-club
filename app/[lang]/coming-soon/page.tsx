import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { GlowBlob } from "@/components/glow-blob"
import { NeonStudioPreview } from "@/components/neon-studio-preview"
import { Sparkles, Home } from "lucide-react"
import Link from "next/link"

export default async function ComingSoonPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const isAr = lang === "ar"

  return (
    <div className="min-h-screen relative flex flex-col" dir={isAr ? "rtl" : "ltr"}>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <GlowBlob className="top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40 dark:opacity-25" color="accent" size="650px" />
      </div>

      <NavBar />

      <main className="flex-1 px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-bold tracking-wide text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? "قريبًا" : "Coming Soon"}
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-balance leading-tight">
            {isAr ? "تجربة تعليمية جديدة كليًا في الطريق" : "A Whole New Learning Experience Is on Its Way"}
          </h1>

          <p className="text-muted-foreground text-base sm:text-xl leading-relaxed max-w-xl mx-auto">
            {isAr
              ? "نعمل خلف الكواليس على شيء يعتمد على أحدث تقنيات الذكاء الاصطناعي، مصمم ليغيّر طريقة تعلّمك مع نيون. التفاصيل لسا سر... بس هذي لمحة عن الشكل."
              : "We're working behind the scenes on something powered by the latest in AI, designed to change the way you learn with NEON. The details are still under wraps — here's a peek at the look."}
          </p>
        </div>

        <div className="mx-auto mt-12 sm:mt-16">
          <NeonStudioPreview isAr={isAr} />
        </div>

        <div className="mt-12 text-center sm:mt-16">
          <Link href={`/${lang}`}>
            <Button size="lg" className="min-h-12 rounded-lg px-8 text-base font-semibold shadow-lg shadow-primary/15 hover-lift hover-glow sm:text-lg">
              <Home className="h-5 w-5 mr-2" />
              {isAr ? "العودة للصفحة الرئيسية" : "Back to Home"}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
