import { Suspense } from "react"
import { neon } from "@neondatabase/serverless"
import { PageHeader } from "@/components/admin/page-header"
import { LessonForm } from "@/components/admin/lesson-form"
import { requireAdmin } from "@/lib/rbac/require-permission"

const sql = neon(process.env.DATABASE_URL!)

async function getCourses() {
  try {
    const result = await sql`
      SELECT id, title_en as "titleEn", title_ar as "titleAr", is_published as "isPublished"
      FROM courses
      WHERE is_published = true
      ORDER BY title_en ASC
    `
    return result
  } catch (error) {
    console.error("[v0] Error fetching courses:", error)
    return []
  }
}

export default async function NewCourseLessonPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  await requireAdmin()
  const courseId = Number.parseInt(params.id)
  
  const coursesData = await getCourses()

  // Find current course title for breadcrumbs
  const currentCourse = coursesData.find((c) => c.id === courseId)

  return (
    <div className="space-y-6">
      <PageHeader
        title={currentCourse ? `Add Lesson: ${currentCourse.titleEn}` : "Create New Lesson"}
        description="Add a new lesson content to the course"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Courses", href: "/admin/courses" },
          { label: currentCourse?.titleEn || "Course", href: `/admin/courses/${courseId}` },
          { label: "New Lesson" },
        ]}
      />

      <Suspense fallback={<div>Loading form...</div>}>
        <LessonForm 
            courses={coursesData as any} 
            initialData={{ course_id: courseId }}
        />
      </Suspense>
    </div>
  )
}
