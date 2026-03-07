import { Suspense } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { CourseForm } from "@/components/admin/course-form"
import { requirePermission } from "@/lib/rbac/require-permission"
import { getAllCategories, getInstructors } from "@/lib/db/queries"

export default async function NewCoursePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  await requirePermission("courses:write")

  const categories = await getAllCategories()
  const instructors = await getInstructors()

  if (!instructors || instructors.length === 0) {
    return (
      <div className="p-8">
        <PageHeader
          title="Create New Course"
          description="Add a new course to the platform"
          breadcrumbs={[
            { label: "Admin", href: `/${lang}/admin` },
            { label: "Courses", href: `/${lang}/admin/courses` },
            { label: "New" },
          ]}
        />
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
          <p className="font-medium">No instructors available</p>
          <p className="text-sm mt-1">Please add instructors before creating a course.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Course"
        description="Add a new course to the platform with complete details"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Courses", href: `/${lang}/admin/courses` },
          { label: "New" },
        ]}
      />

      <div className="grid gap-8">
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading form...</div>}>
          <CourseForm categories={categories as any} instructors={instructors as any} lang={lang} />
        </Suspense>
      </div>
    </div>
  )
}
