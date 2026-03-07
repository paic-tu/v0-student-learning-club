import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { CourseEditForm } from "@/components/admin/course-edit-form"
import { getAllCategories } from "@/lib/db/queries"
import { db } from "@/lib/db"
import { courses } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export default async function InstructorCourseEditPage({ params }: { params: Promise<{ lang: string, courseId: string }> }) {
  const { lang, courseId } = await params
  const session = await auth()
  
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

  const course = {
    ...courseRaw,
    category_name: courseRaw.category?.nameEn
  }

  const categories = await getAllCategories()
  
  // Instructors can only see themselves
  const instructors = [{
    id: session.user.id,
    name: session.user.name || "Instructor",
    email: session.user.email || ""
  }]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Course Settings</h1>
      </div>
      <CourseEditForm course={course} categories={categories as any} instructors={instructors as any} />
    </div>
  )
}
