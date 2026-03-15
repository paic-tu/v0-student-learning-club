import Link from "next/link"
import { db } from "@/lib/db"
import { challenges } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { NavBar } from "@/components/nav-bar"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { unstable_noStore as noStore } from "next/cache"

export const dynamic = "force-dynamic"

export default async function ChallengesPage({ params }: { params: Promise<{ lang: string }> }) {
  noStore()
  const { lang } = await params
  
  const isAr = lang === "ar"
  if (isAr) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 container mx-auto px-4 py-10">
          <div className="max-w-2xl mx-auto" dir="rtl">
            <Card>
              <CardHeader>
                <CardTitle>قيد الصيانة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>صفحة التحديات غير متاحة حالياً. سيتم إرجاعها قريباً.</div>
                <Link className="underline text-foreground" href="/ar">
                  الرجوع للرئيسية
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }
  const all = await db.query.challenges.findMany({
    where: eq(challenges.isActive, true),
    orderBy: [desc(challenges.createdAt)],
    limit: 100,
  })

  const list = all.filter((c: any) => {
    if (c.type === "quiz") return true
    if (c.type === "coding" && c.testCases && typeof c.testCases === "object" && c.testCases.format === "find_bug_python") return true
    return false
  })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 space-y-2" dir={isAr ? "rtl" : "ltr"}>
            <h1 className="text-3xl font-bold">{isAr ? "التحديات" : "Challenges"}</h1>
            <p className="text-muted-foreground">
              {isAr ? "اختر تحديًا وابدأ الحل" : "Pick a challenge and start solving"}
            </p>
          </div>

          {list.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground" dir={isAr ? "rtl" : "ltr"}>
              {isAr ? "لا توجد تحديات متاحة حالياً" : "No challenges available yet"}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {list.map((c: any) => {
                const format = c.type === "coding" ? c.testCases?.format : c.type
                const badgeText =
                  format === "find_bug_python"
                    ? isAr
                      ? "اكتشف الخطأ (بايثون)"
                      : "Find the Bug (Python)"
                    : c.type === "quiz"
                      ? isAr
                        ? "اختبار"
                        : "Quiz"
                      : c.type

                return (
                  <Link key={c.id} href={`/${lang}/challenges/${c.id}`}>
                    <Card className="h-full hover:shadow-md transition-shadow">
                      <CardHeader className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary">{badgeText}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {c.points} {isAr ? "نقطة" : "pts"}
                          </span>
                        </div>
                        <CardTitle className="line-clamp-2">{isAr ? c.titleAr : c.titleEn}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">{isAr ? c.descriptionAr : c.descriptionEn}</p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
