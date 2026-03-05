import { auth } from "@/lib/auth"
import { getCourseById, getEnrollment } from "@/lib/db/queries"
import { notFound, redirect } from "next/navigation"
import { LessonPlayerClient } from "@/components/lesson-player-client"

export default async function LessonPage(props: { params: Promise<{ lang: string; courseId: string; lessonId: string }> }) {
  const params = await props.params
  const { lang, courseId, lessonId } = params

  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${lang}/auth/login?callbackUrl=/${lang}/courses/${courseId}/learn/${lessonId}`)
  }

  // Check enrollment
  const enrollment = await getEnrollment(session.user.id, courseId)
  if (!enrollment) {
    redirect(`/${lang}/courses/${courseId}`)
  }

  const course = await getCourseById(courseId)
  if (!course) {
    notFound()
  }

  // Find current lesson
  const lesson = course.lessons.find((l: any) => l.id === lessonId)
  if (!lesson) {
    notFound()
  }

  let completedIds: string[] = []
  if (Array.isArray(enrollment.completed_lessons)) {
    completedIds = enrollment.completed_lessons
  } else if (typeof enrollment.completed_lessons === 'string') {
    try {
      completedIds = JSON.parse(enrollment.completed_lessons)
    } catch (e) {
      console.error("Failed to parse completed_lessons", e)
    }
  }

  return (
    <LessonPlayerClient 
      course={course}
      lesson={lesson}
      allLessons={course.lessons}
      completedLessonIds={completedIds}
    />
  )
}
