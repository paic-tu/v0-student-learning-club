import { Suspense } from "react"
import { neon } from "@neondatabase/serverless"
import { notFound, redirect } from "next/navigation"
import { PageHeader } from "@/components/admin/page-header"
import { LessonForm } from "@/components/admin/lesson-form"
import { requireAdmin } from "@/lib/rbac/require-permission"

const sql = neon(process.env.DATABASE_URL!)

async function getCourses() {
  try {
    const result = await sql`
      SELECT id, title_en as "titleEn", title_ar as "titleAr", is_published as "isPublished"
      FROM courses
      ORDER BY title_en ASC
    `
    return result
  } catch (error) {
    console.error("[v0] Error fetching courses:", error)
    return []
  }
}

async function getLesson(id: string) {
  try {
    const result = await sql`
      SELECT * FROM lessons WHERE id = ${id} LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error fetching lesson:", error)
    return null
  }
}

export default async function EditCourseLessonPage(props: { params: Promise<{ id: string; lessonId: string }> }) {
  const params = await props.params
  await requireAdmin()
  const { id: courseId, lessonId } = params

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
        title={`Edit Lesson: ${lesson.title_en}`}
        description="Update lesson content and settings"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Courses", href: "/admin/courses" },
          { label: currentCourse?.titleEn || "Course", href: `/admin/courses/${courseId}` },
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
