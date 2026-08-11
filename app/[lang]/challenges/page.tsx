import Link from "next/link"
import { NavBar } from "@/components/nav-bar"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ChallengesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params

  const isAr = lang === "ar"
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <main className="relative z-10 flex-1 container mx-auto px-4 pt-28 pb-10 sm:pt-32">
        <div className="max-w-2xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
          <Card className="border-primary/15 bg-card/30 shadow-xl shadow-background/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>{isAr ? "قيد الصيانة" : "Under Maintenance"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                {isAr
                  ? "صفحة التحديات غير متاحة حالياً. سيتم إرجاعها قريباً."
                  : "The Challenges page is currently unavailable. It will be back soon."}
              </div>
              <Link className="underline text-foreground" href={`/${lang}`}>
                {isAr ? "الرجوع للرئيسية" : "Back to Home"}
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
