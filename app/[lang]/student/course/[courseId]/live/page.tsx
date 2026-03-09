import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import LiveClassroomClient from "./client"
import { getCourseById, getEnrollment } from "@/lib/db/queries"

export default async function LiveClassroomPage({
  params,
}: {
  params: Promise<{ lang: string; courseId: string }>
}) {
  const { lang, courseId } = await params
  const session = await auth()
  
  if (!session || !session.user) {
    redirect(`/${lang}/auth/login`)
  }
  const isAr = lang === "ar"
  
  const roomName = `course-${courseId}`

  const course = await getCourseById(courseId)
  if (!course) {
    notFound()
  }

  const role = (session.user as any).role || "student"
  if (role !== "instructor" && role !== "admin") {
    const enrollment = await getEnrollment(session.user.id, courseId)
    if (!enrollment) {
      redirect(`/${lang}/student/course/${courseId}`)
    }
    if (!course.isLive) {
      redirect(`/${lang}/student/course/${courseId}`)
    }
  }

  return (
    <LiveClassroomClient
      roomName={roomName}
      user={{
        id: session.user.id,
        name: session.user.name || "User",
        role: (session.user as any).role || "student",
      }}
      isAr={isAr}
    />
  )
}
