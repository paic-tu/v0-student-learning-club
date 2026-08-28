import { db } from "@/lib/db"
import { courses } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { desc, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssignmentForm } from "@/components/assignments/assignment-form"
import { getCourseById } from "@/lib/db/queries"
import { InstructorCourseShell } from "@/components/instructor/course-shell"

export default async function InstructorAssignmentNewPage(props: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ courseId?: string }>
}) {
  const { lang } = await props.params
  const { courseId } = await props.searchParams
  const isAr = lang === "ar"
  const session = await auth()
  if (!session?.user?.id) redirect(`/${lang}/auth/login`)
  if (session.user.role !== "instructor") redirect(`/${lang}/dashboard`)

  const courseRows = await db.query.courses.findMany({
    where: eq(courses.instructorId, session.user.id),
    columns: { id: true, titleEn: true, titleAr: true },
    orderBy: [desc(courses.createdAt)],
    limit: 500,
  })

  const content = (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{isAr ? "إضافة واجب" : "New Assignment"}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "معلومات الواجب" : "Assignment details"}</CardTitle>
        </CardHeader>
        <CardContent>
          <AssignmentForm
            lang={lang}
            apiUrl="/api/instructor/assignments"
            courses={courseRows}
            redirectTo={courseId ? `/${lang}/instructor/courses/${courseId}/assignments` : `/${lang}/instructor/assignments`}
            lockedCourseId={courseId}
          />
        </CardContent>
      </Card>
    </div>
  )

  if (courseId) {
    const course = await getCourseById(courseId)
    if (!course) redirect(`/${lang}/instructor/courses`)
    if (course.instructorId !== session.user.id) redirect(`/${lang}/access-denied`)

    return (
      <InstructorCourseShell course={course} lang={lang} courseId={courseId}>
        {content}
      </InstructorCourseShell>
    )
  }

  return content
}
