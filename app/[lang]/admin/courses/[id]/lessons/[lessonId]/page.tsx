import { Suspense } from "react"
import { db } from "@/lib/db"
import { lessons, courses } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import { PageHeader } from "@/components/admin/page-header"
import { LessonForm } from "@/components/admin/lesson-form"
import { requireAdmin } from "@/lib/rbac/require-permission"

async function getCourses() {
  try {
    const result = await db.query.courses.findMany({
      columns: {
        id: true,
        titleEn: true,
        titleAr: true,
        isPublished: true,
      },
      orderBy: [asc(courses.titleEn)],
    })
    return result
  } catch (error) {
    console.error("[v0] Error fetching courses:", error)
    return []
  }
}

async function getLesson(id: string) {
  try {
    const result = await db.query.lessons.findFirst({
      where: eq(lessons.id, id),
    })
    return result || null
  } catch (error) {
    console.error("[v0] Error fetching lesson:", error)
    return null
  }
}

export default async function EditCourseLessonPage(props: { params: Promise<{ lang: string; id: string; lessonId: string }> }) {
  const params = await props.params
  await requireAdmin()
  const { lang, id: courseId, lessonId } = params

  if (!courseId || !lessonId) {
    notFound()
  }

  const [lesson, coursesData] = await Promise.all([
    getLesson(lessonId),
    getCourses()
  ])

  if (!lesson) {
    notFound()
  }

  // Find current course title for breadcrumbs
  const currentCourse = coursesData.find((c) => c.id === courseId)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Lesson: ${lesson.titleEn || lesson.titleAr || "Untitled"}`}
        description="Update lesson content and settings"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Courses", href: `/${lang}/admin/courses` },
          { label: currentCourse?.titleEn || "Course", href: `/${lang}/admin/courses/${courseId}` },
          { label: "Edit Lesson" },
        ]}
      />

      <Suspense fallback={<div>Loading form...</div>}>
        <LessonForm 
            courses={coursesData as any} 
            initialData={lesson}
        />
      </Suspense>
    </div>
  )
}
