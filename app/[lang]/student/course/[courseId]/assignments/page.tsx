import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { assignmentSubmissions, assignments } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, FileText } from "lucide-react"
import Link from "next/link"

export default async function CourseAssignmentsPage(props: { params: Promise<{ lang: string; courseId: string }> }) {
  const { lang, courseId } = await props.params
  const isAr = lang === "ar"
  const session = await auth()
  if (!session?.user?.id) redirect(`/${lang}/auth/login?callbackUrl=/${lang}/student/course/${courseId}/assignments`)
  const userId = session.user.id

  const rows = await db
    .select({
      id: assignments.id,
      titleEn: assignments.titleEn,
      titleAr: assignments.titleAr,
      dueAt: assignments.dueAt,
      createdAt: assignments.createdAt,
      submissionId: assignmentSubmissions.id,
      submittedAt: assignmentSubmissions.submittedAt,
    })
    .from(assignments)
    .leftJoin(
      assignmentSubmissions,
      and(eq(assignmentSubmissions.assignmentId, assignments.id), eq(assignmentSubmissions.userId, userId)),
    )
    .where(and(eq(assignments.courseId, courseId), eq(assignments.isPublished, true)))
    .orderBy(desc(assignments.createdAt))
    .limit(500)

  const now = Date.now()

  const getStatus = (r: (typeof rows)[number]) => {
    if (r.submissionId) {
      return { key: "submitted", label: isAr ? "تم التسليم" : "Submitted", variant: "default" as const }
    }
    if (r.dueAt && new Date(r.dueAt).getTime() < now) {
      return { key: "late", label: isAr ? "متأخر" : "Late", variant: "destructive" as const }
    }
    return { key: "pending", label: isAr ? "لم يُسلّم بعد" : "Not submitted yet", variant: "secondary" as const }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{isAr ? "الواجبات" : "Assignments"}</h1>
        <p className="text-muted-foreground">
          {isAr ? "ارفع تسليماتك وتابع حالتك" : "Submit your work and track status"}
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <FileText className="h-8 w-8" />
            <p>{isAr ? "لا توجد واجبات لهذا الكورس حالياً." : "No assignments for this course yet."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rows.map((r) => {
            const status = getStatus(r)
            return (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{isAr ? r.titleAr : r.titleEn}</CardTitle>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {isAr ? "آخر موعد: " : "Due: "}
                    {r.dueAt ? new Date(r.dueAt).toLocaleString() : "-"}
                  </div>
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <Link href={`/${lang}/student/assignments/${r.id}`}>{isAr ? "فتح" : "Open"}</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
