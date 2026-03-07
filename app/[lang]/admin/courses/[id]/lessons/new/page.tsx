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

export default async function NewCourseLessonPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  await requireAdmin()
  const courseId = params.id
  
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
