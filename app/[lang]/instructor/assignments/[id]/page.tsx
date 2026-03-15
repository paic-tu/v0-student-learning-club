import { db } from "@/lib/db"
import { assignmentSubmissions, assignments, courses, users } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function InstructorAssignmentDetailsPage(props: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await props.params
  const isAr = lang === "ar"
  const session = await auth()
  if (!session?.user?.id) redirect(`/${lang}/auth/login`)
  if (session.user.role !== "instructor") redirect(`/${lang}/dashboard`)

  const assignment = await db
    .select({
      id: assignments.id,
      courseId: assignments.courseId,
      titleEn: assignments.titleEn,
      titleAr: assignments.titleAr,
      descriptionEn: assignments.descriptionEn,
      descriptionAr: assignments.descriptionAr,
      dueAt: assignments.dueAt,
      isPublished: assignments.isPublished,
      createdAt: assignments.createdAt,
      courseTitleEn: courses.titleEn,
      courseTitleAr: courses.titleAr,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(and(eq(assignments.id, id), eq(courses.instructorId, session.user.id)))
    .limit(1)

  const a = assignment[0]
  if (!a) {
    return <div>{isAr ? "غير موجود" : "Not found"}</div>
  }

  let submissions: Array<{
    id: string
    textContent?: string | null
    fileUrl?: string | null
    fileName?: string | null
    fileSize?: number | null
    submittedAt: Date | null
    status: string
    userName: string
    userEmail: string
  }> = []

  try {
    submissions = await db
      .select({
        id: assignmentSubmissions.id,
        textContent: assignmentSubmissions.textContent,
        fileUrl: assignmentSubmissions.fileUrl,
        fileName: assignmentSubmissions.fileName,
        fileSize: assignmentSubmissions.fileSize,
        submittedAt: assignmentSubmissions.submittedAt,
        status: assignmentSubmissions.status,
        userName: users.name,
        userEmail: users.email,
      })
      .from(assignmentSubmissions)
      .innerJoin(users, eq(assignmentSubmissions.userId, users.id))
      .where(eq(assignmentSubmissions.assignmentId, id))
      .orderBy(desc(assignmentSubmissions.submittedAt))
      .limit(500)
  } catch {
    const rows = await db
      .select({
        id: assignmentSubmissions.id,
        fileUrl: assignmentSubmissions.fileUrl,
        fileName: assignmentSubmissions.fileName,
        fileSize: assignmentSubmissions.fileSize,
        submittedAt: assignmentSubmissions.submittedAt,
        status: assignmentSubmissions.status,
        userName: users.name,
        userEmail: users.email,
      })
      .from(assignmentSubmissions)
      .innerJoin(users, eq(assignmentSubmissions.userId, users.id))
      .where(eq(assignmentSubmissions.assignmentId, id))
      .orderBy(desc(assignmentSubmissions.submittedAt))
      .limit(500)
    submissions = rows.map((r) => ({ ...r, textContent: null }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isAr ? a.titleAr : a.titleEn}</h1>
        <div className="text-muted-foreground">{isAr ? a.courseTitleAr : a.courseTitleEn}</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "تفاصيل الواجب" : "Details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" dir={isAr ? "rtl" : "ltr"}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={a.isPublished ? "default" : "secondary"}>{a.isPublished ? (isAr ? "منشور" : "Published") : isAr ? "غير منشور" : "Hidden"}</Badge>
            <div className="text-sm text-muted-foreground">
              {isAr ? "آخر موعد:" : "Due:"} {a.dueAt ? new Date(a.dueAt).toLocaleString() : "-"}
            </div>
          </div>
          {(isAr ? a.descriptionAr : a.descriptionEn) && <div className="text-sm whitespace-pre-wrap">{isAr ? a.descriptionAr : a.descriptionEn}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? `التسليمات (${submissions.length})` : `Submissions (${submissions.length})`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "الطالب" : "Student"}</TableHead>
                <TableHead>{isAr ? "الوقت" : "Time"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "الملف" : "File"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.userName}</div>
                    <div className="text-xs text-muted-foreground">{s.userEmail}</div>
                  </TableCell>
                  <TableCell>{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "submitted" ? "default" : "secondary"}>{s.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {s.fileUrl && s.fileName ? (
                      <div className="space-y-1">
                        <a className="underline" href={s.fileUrl} target="_blank" rel="noreferrer">
                          {s.fileName}
                        </a>
                        {s.fileSize ? (
                          <div className="text-xs text-muted-foreground">{Math.round(Number(s.fileSize) / 1024 / 1024)} MB</div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">-</div>
                    )}
                    {s.textContent ? <div className="mt-2 text-sm whitespace-pre-wrap">{s.textContent}</div> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
