import { NavBar } from "@/components/nav-bar"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getCourseById, checkEnrollmentStatus } from "@/lib/db/queries"
import { checkBookmarkStatus } from "@/lib/actions/bookmark"
import { CourseDetailClient } from "@/components/course-detail-client"
import { getCurrentUser } from "@/lib/auth"
import type { Metadata } from "next"

export async function generateMetadata(
  { params }: { params: Promise<{ lang: string; courseId: string }> }
): Promise<Metadata> {
  const { lang, courseId } = await params
  const course = await getCourseById(courseId)

  if (!course) {
    return {
      title: lang === 'ar' ? 'دورة غير موجودة' : 'Course Not Found',
    }
  }

  // Cast course to any to handle potential type mismatches with the query result
  const c = course as any
  const title = lang === 'ar' ? (c.titleAr || c.title) : (c.titleEn || c.title)
  const description = lang === 'ar' ? (c.descriptionAr || c.description) : (c.descriptionEn || c.description)
  // Ensure we have a valid absolute URL for the image if possible, or relative
  const image = c.thumbnailUrl || c.image || '/og-image.png'

  return {
    title: title,
    description: description?.substring(0, 160),
    openGraph: {
      title: title,
      description: description?.substring(0, 200),
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description?.substring(0, 200),
      images: [image],
    }
  }
}

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
