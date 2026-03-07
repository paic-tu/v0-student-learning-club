import { Suspense } from "react"
import { db } from "@/lib/db"
import { courses } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { PageHeader } from "@/components/admin/page-header"
import { LessonForm } from "@/components/admin/lesson-form"
import { requireAdmin } from "@/lib/rbac/require-permission"

async function getCourses() {
  try {
    const result = await db.query.courses.findMany({
      where: eq(courses.isPublished, true),
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
