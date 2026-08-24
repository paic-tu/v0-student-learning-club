import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { getCourseEnrollments } from "@/lib/db/queries"
import { db } from "@/lib/db"
import { courses } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { CourseStudentsTable } from "@/components/instructor/course-students-table"

export default async function InstructorCourseStudentsPage({
  params,
}: {
  params: Promise<{ lang: string; courseId: string }>
}) {
  const { lang, courseId } = await params
  const session = await auth()

  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), eq(courses.instructorId, session.user.id)),
    columns: { id: true },
  })

  if (!course) {
    notFound()
  }

  const enrollments = await getCourseEnrollments(courseId)

  return <CourseStudentsTable lang={lang} enrollments={enrollments} />
}
