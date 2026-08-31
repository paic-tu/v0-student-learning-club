import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { getCourseById } from "@/lib/db/queries"
import { CourseLiveSession } from "@/components/instructor/course-live-session"

export default async function InstructorLiveClassroomPage({
  params,
}: {
  params: Promise<{ lang: string; courseId: string }>
}) {
  const { lang, courseId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${lang}/auth/login`)
  }

  const role = (session.user as any).role || "student"
  if (role !== "instructor" && role !== "admin") {
    redirect(`/${lang}/access-denied`)
  }

  const course = await getCourseById(courseId)
  if (!course) notFound()

  if (role !== "admin" && course.instructorId !== session.user.id) {
    redirect(`/${lang}/access-denied`)
  }

  const isAr = lang === "ar"

  return (
    <CourseLiveSession
      courseId={courseId}
      isAr={isAr}
      user={{
        id: session.user.id,
        name: session.user.name || "User",
        role,
      }}
      initialIsStreaming={Boolean(course.isStreaming)}
    />
  )
}
