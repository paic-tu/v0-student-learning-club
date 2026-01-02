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

export default async function NewLessonPage() {
  await requireAdmin()
  const coursesData = await getCourses()

  return (
    <div>
      <PageHeader
        title="Create New Lesson"
        description="Add a new lesson to a course"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Lessons", href: "/admin/lessons" },
          { label: "New" },
        ]}
      />

      <Suspense fallback={<div>Loading form...</div>}>
        <LessonForm courses={coursesData as any} />
      </Suspense>
    </div>
  )
}
