import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import LiveClassroomClient from "@/components/live-classroom-client"
import { getCourseById } from "@/lib/db/queries"

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

  if (!course.isLive) {
    redirect(`/${lang}/instructor/courses/${courseId}/edit`)
  }

  if (role !== "admin" && course.instructorId !== session.user.id) {
    redirect(`/${lang}/access-denied`)
  }

  const isAr = lang === "ar"
  const roomName = `course-${courseId}`

  return (
    <div className="-m-8 h-screen">
      <LiveClassroomClient
        roomName={roomName}
        user={{
          id: session.user.id,
          name: session.user.name || "User",
          role,
        }}
        isAr={isAr}
        mode="instructor"
      />
    </div>
  )
}
