import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getCourseById } from "@/lib/db/queries"
import { InstructorCourseShell } from "@/components/instructor/course-shell"

export default async function InstructorCourseLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string; courseId: string }>
}) {
  const { lang, courseId } = await params
  const session = await auth()

  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  // Fetch course
  const course = await getCourseById(courseId)

  if (!course) {
    redirect(`/${lang}/instructor/courses`)
  }

  // Verify ownership
  if (course.instructorId !== session.user.id && session.user.role !== "admin") {
    redirect(`/${lang}/access-denied`)
  }

  return (
    <InstructorCourseShell course={course} lang={lang} courseId={courseId}>
      {children}
    </InstructorCourseShell>
  )
}
