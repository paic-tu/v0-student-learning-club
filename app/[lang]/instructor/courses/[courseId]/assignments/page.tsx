import { db } from "@/lib/db"
import { assignments } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, PlusCircle } from "lucide-react"

export default async function InstructorCourseAssignmentsPage({
  params,
}: {
  params: Promise<{ lang: string; courseId: string }>
}) {
  const { lang, courseId } = await params
  const isAr = lang === "ar"

  const rows = await db
    .select({
      id: assignments.id,
      titleEn: assignments.titleEn,
      titleAr: assignments.titleAr,
      dueAt: assignments.dueAt,
      isPublished: assignments.isPublished,
    })
    .from(assignments)
    .where(eq(assignments.courseId, courseId))
    .orderBy(desc(assignments.createdAt))
    .limit(200)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAr ? "الواجبات" : "Assignments"}</h1>
        <Button asChild>
          <Link href={`/${lang}/instructor/assignments/new`}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {isAr ? "إضافة واجب" : "New assignment"}
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {isAr ? "لا توجد واجبات بعد." : "No assignments yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{isAr ? a.titleAr || a.titleEn : a.titleEn || a.titleAr}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? "آخر موعد:" : "Due:"} {a.dueAt ? new Date(a.dueAt).toLocaleString() : "-"}
                  </div>
                </div>
                <Badge variant={a.isPublished ? "default" : "secondary"} className="shrink-0">
                  {a.isPublished ? (isAr ? "منشور" : "Published") : isAr ? "غير منشور" : "Hidden"}
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${lang}/instructor/assignments/${a.id}`}>{isAr ? "عرض" : "View"}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
