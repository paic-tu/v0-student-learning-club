import { db } from "@/lib/db"
import { assignments, courses } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { desc, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function InstructorAssignmentsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  const isAr = lang === "ar"
  const session = await auth()
  if (!session?.user?.id) redirect(`/${lang}/auth/login`)
  if (session.user.role !== "instructor") redirect(`/${lang}/dashboard`)

  const rows = await db
    .select({
      id: assignments.id,
      titleEn: assignments.titleEn,
      titleAr: assignments.titleAr,
      dueAt: assignments.dueAt,
      isPublished: assignments.isPublished,
      createdAt: assignments.createdAt,
      courseTitleEn: courses.titleEn,
      courseTitleAr: courses.titleAr,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(eq(courses.instructorId, session.user.id))
    .orderBy(desc(assignments.createdAt))
    .limit(200)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{isAr ? "الواجبات" : "Assignments"}</h1>
          <p className="text-muted-foreground">{isAr ? "إضافة واجبات ومتابعة التسليمات" : "Create assignments and review submissions"}</p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/instructor/assignments/new`}>{isAr ? "إضافة واجب" : "New assignment"}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? `واجباتي (${rows.length})` : `My assignments (${rows.length})`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                <TableHead>{isAr ? "الدورة" : "Course"}</TableHead>
                <TableHead>{isAr ? "التسليم" : "Due"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{isAr ? r.titleAr : r.titleEn}</TableCell>
                  <TableCell>{isAr ? r.courseTitleAr : r.courseTitleEn}</TableCell>
                  <TableCell>{r.dueAt ? new Date(r.dueAt).toLocaleString() : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={r.isPublished ? "default" : "secondary"}>{r.isPublished ? (isAr ? "منشور" : "Published") : isAr ? "غير منشور" : "Hidden"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${lang}/instructor/assignments/${r.id}`}>{isAr ? "عرض" : "View"}</Link>
                    </Button>
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

