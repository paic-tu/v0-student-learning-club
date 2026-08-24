import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { courses } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { CourseDangerZone } from "@/components/instructor/course-danger-zone"

export default async function InstructorCourseManagePage({
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

  return <CourseDangerZone lang={lang} courseId={courseId} />
}
