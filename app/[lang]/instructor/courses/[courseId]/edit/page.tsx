import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { CourseManagement } from "@/components/instructor/course-management"
import { getAllCategories, getCourseEnrollments } from "@/lib/db/queries"
import { db } from "@/lib/db"
import { courses } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export default async function InstructorCourseEditPage({ params }: { params: Promise<{ lang: string, courseId: string }> }) {
  const { lang, courseId } = await params
  const session = await auth()
  const isAr = lang === "ar"
  
  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  // Fetch course and verify ownership
  const courseRaw = await db.query.courses.findFirst({
    where: and(
      eq(courses.id, courseId),
      eq(courses.instructorId, session.user.id)
    ),
    with: {
      category: true
    }
  })

  if (!courseRaw) {
    notFound()
  }

  const enrollments = await getCourseEnrollments(courseId)

  const course = {
    ...courseRaw,
    category_name: courseRaw.category?.nameEn,
    title_en: courseRaw.titleEn,
    title_ar: courseRaw.titleAr,
    subtitle_en: courseRaw.subtitleEn,
    subtitle_ar: courseRaw.subtitleAr,
    description_en: courseRaw.descriptionEn,
    description_ar: courseRaw.descriptionAr,
    instructor_id: courseRaw.instructorId,
    category_id: courseRaw.categoryId,
    thumbnail_url: courseRaw.thumbnailUrl,
    video_url: courseRaw.previewVideoUrl,
    is_free: courseRaw.isFree,
    is_live: courseRaw.isLive,
    is_published: courseRaw.isPublished,
    learning_outcomes: courseRaw.learningOutcomes,
  }

  const categories = await getAllCategories()
  
  // Instructors can only see themselves
  const instructors = [{
    id: session.user.id,
    name: session.user.name || "Instructor",
    email: session.user.email || ""
  }]

  const stats = {
    totalStudents: courseRaw.enrollmentCount || 0,
    rating: Number(courseRaw.rating) || 0,
    reviews: courseRaw.reviewsCount || 0
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{isAr ? "إدارة الدورة" : "Manage Course"}</h1>
      </div>
      <CourseManagement 
        course={course} 
        categories={categories as any} 
        instructors={instructors as any} 
        lang={lang}
        enrollments={enrollments}
        stats={stats}
      />
    </div>
  )
}
