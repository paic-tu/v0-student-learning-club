import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { assignmentSubmissions, assignments, courses, enrollments, orderItems, orders } from "@/lib/db/schema"
import { and, count, eq, inArray } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AssignmentSubmitForm } from "@/components/assignments/assignment-submit-form"

async function canAccessCourse(userId: string, courseId: string) {
  const enrollment = await db.query.enrollments.findFirst({
    where: and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
    columns: { id: true },
  })
  if (!enrollment) return false

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    columns: { isFree: true, price: true },
  })
  if (!course) return false
  if (course.isFree) return true

  const priceNumber = Number.parseFloat(String(course.price))
  const isPaidCourse = Number.isFinite(priceNumber) && priceNumber > 0
  if (!isPaidCourse) return true

  const rows = await db
    .select({ c: count() })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.userId, userId), inArray(orders.status, ["paid", "shipped", "delivered"]), eq(orderItems.courseId, courseId)))
  return (rows[0]?.c ?? 0) > 0
}

export default async function StudentAssignmentDetailsPage(props: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await props.params
  const isAr = lang === "ar"
  const user = await getCurrentUser()
  if (!user) redirect(`/${lang}/auth/login`)
  if (user.role !== "student") redirect(`/${lang}/dashboard`)

  const a = await db
    .select({
      id: assignments.id,
      courseId: assignments.courseId,
      titleEn: assignments.titleEn,
      titleAr: assignments.titleAr,
      descriptionEn: assignments.descriptionEn,
      descriptionAr: assignments.descriptionAr,
      dueAt: assignments.dueAt,
      maxBytes: assignments.maxFileSizeBytes,
      courseTitleEn: courses.titleEn,
      courseTitleAr: courses.titleAr,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(and(eq(assignments.id, id), eq(assignments.isPublished, true)))
    .limit(1)

  const assignment = a[0]
  if (!assignment) return <div>{isAr ? "غير موجود" : "Not found"}</div>

  const allowed = await canAccessCourse(user.id, assignment.courseId)
  if (!allowed) redirect(`/${lang}/courses/${assignment.courseId}`)

  let submission:
    | {
        textContent?: string | null
        fileUrl?: string | null
        fileName?: string | null
        fileSize?: number | null
        submittedAt: Date | null
        status: string
      }
    | null = null

  try {
    submission = await db.query.assignmentSubmissions.findFirst({
      where: and(eq(assignmentSubmissions.assignmentId, id), eq(assignmentSubmissions.userId, user.id)),
      columns: { textContent: true, fileUrl: true, fileName: true, fileSize: true, submittedAt: true, status: true },
    })
  } catch {
    submission = await db.query.assignmentSubmissions.findFirst({
      where: and(eq(assignmentSubmissions.assignmentId, id), eq(assignmentSubmissions.userId, user.id)),
      columns: { fileUrl: true, fileName: true, fileSize: true, submittedAt: true, status: true },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isAr ? assignment.titleAr : assignment.titleEn}</h1>
        <div className="text-muted-foreground">{isAr ? assignment.courseTitleAr : assignment.courseTitleEn}</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "تفاصيل الواجب" : "Details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" dir={isAr ? "rtl" : "ltr"}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={submission ? "default" : "secondary"}>{submission ? (isAr ? "تم التسليم" : "Submitted") : isAr ? "لم يتم" : "Not submitted"}</Badge>
            <div className="text-sm text-muted-foreground">
              {isAr ? "آخر موعد:" : "Due:"} {assignment.dueAt ? new Date(assignment.dueAt).toLocaleString() : "-"}
            </div>
          </div>
          {(isAr ? assignment.descriptionAr : assignment.descriptionEn) && (
            <div className="text-sm whitespace-pre-wrap">{isAr ? assignment.descriptionAr : assignment.descriptionEn}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "تسليم الواجب" : "Submission"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AssignmentSubmitForm
            lang={lang}
            assignmentId={id}
            maxBytes={assignment.maxBytes}
            existingFileUrl={submission?.fileUrl || null}
            existingTextContent={submission?.textContent || null}
          />
          {submission && (
            <div className="text-sm text-muted-foreground" dir={isAr ? "rtl" : "ltr"}>
              {isAr ? "آخر تسليم:" : "Last submitted:"} {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "-"}
              {submission.fileSize ? ` • ${Math.round(Number(submission.fileSize) / 1024 / 1024)} MB` : ""}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
