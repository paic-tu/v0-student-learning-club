import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { assignmentSubmissions, assignments, courses, enrollments } from "@/lib/db/schema"
import { and, desc, eq, inArray } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function StudentAssignmentsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  const isAr = lang === "ar"
  const user = await getCurrentUser()
  if (!user) redirect(`/${lang}/auth/login`)
  if (user.role !== "student") redirect(`/${lang}/dashboard`)

  const enrolled = await db.query.enrollments.findMany({
    where: eq(enrollments.userId, user.id),
    columns: { courseId: true },
  })
  const courseIds = enrolled.map((e) => e.courseId).filter(Boolean) as string[]
  if (courseIds.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{isAr ? "واجباتي" : "My Assignments"}</h1>
        <div className="text-muted-foreground">{isAr ? "لا توجد واجبات حالياً." : "No assignments yet."}</div>
      </div>
    )
  }

  const rows = await db
    .select({
      id: assignments.id,
      courseId: assignments.courseId,
      titleEn: assignments.titleEn,
      titleAr: assignments.titleAr,
      dueAt: assignments.dueAt,
      createdAt: assignments.createdAt,
      courseTitleEn: courses.titleEn,
      courseTitleAr: courses.titleAr,
      submissionId: assignmentSubmissions.id,
      submittedAt: assignmentSubmissions.submittedAt,
      submissionStatus: assignmentSubmissions.status,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .leftJoin(
      assignmentSubmissions,
      and(eq(assignmentSubmissions.assignmentId, assignments.id), eq(assignmentSubmissions.userId, user.id)),
    )
    .where(and(inArray(assignments.courseId, courseIds), eq(assignments.isPublished, true)))
    .orderBy(desc(assignments.createdAt))
    .limit(500)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isAr ? "واجباتي" : "My Assignments"}</h1>
        <p className="text-muted-foreground">{isAr ? "ارفع تسليماتك وتابع حالتك" : "Submit your work and track status"}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? `الواجبات (${rows.length})` : `Assignments (${rows.length})`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "الواجب" : "Assignment"}</TableHead>
                <TableHead>{isAr ? "الدورة" : "Course"}</TableHead>
                <TableHead>{isAr ? "آخر موعد" : "Due"}</TableHead>
                <TableHead>{isAr ? "حالة التسليم" : "Submission"}</TableHead>
                <TableHead>{isAr ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const submitted = Boolean(r.submissionId)
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{isAr ? r.titleAr : r.titleEn}</TableCell>
                    <TableCell>{isAr ? r.courseTitleAr : r.courseTitleEn}</TableCell>
                    <TableCell>{r.dueAt ? new Date(r.dueAt).toLocaleString() : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={submitted ? "default" : "secondary"}>
                        {submitted ? (isAr ? "تم التسليم" : "Submitted") : isAr ? "لم يتم" : "Not submitted"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/${lang}/student/assignments/${r.id}`}>{isAr ? "فتح" : "Open"}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

