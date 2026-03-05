import { NavBar } from "@/components/nav-bar"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getCourseById, checkEnrollmentStatus } from "@/lib/db/queries"
import { checkBookmarkStatus } from "@/app/actions/bookmark"
import { CourseDetailClient } from "@/components/course-detail-client"
import { getCurrentUser } from "@/lib/auth"

export default async function CourseDetailPage(props: { params: Promise<{ lang: string; courseId: string }> }) {
  const params = await props.params
  const { courseId } = params
  
  const user = await getCurrentUser()

  const [course, isBookmarked, isEnrolledDB] = await Promise.all([
    getCourseById(courseId),
    checkBookmarkStatus(courseId),
    user ? checkEnrollmentStatus(user.id, courseId) : Promise.resolve(false)
  ])

  if (!course) {
    notFound()
  }

  const courseAny = course as any
  const isInstructor = user?.id === courseAny.instructor_id
  const isEnrolled = isEnrolledDB || isInstructor

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <Suspense fallback={<div className="p-8 text-center">Loading course...</div>}>
        <CourseDetailClient 
          course={course} 
          initialBookmarked={isBookmarked}
          initialEnrolled={isEnrolled}
        />
      </Suspense>
    </div>
  )
}
