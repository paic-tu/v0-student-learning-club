import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { CourseEditForm } from "@/components/admin/course-edit-form"
import { getAllCategories } from "@/lib/db/queries"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

export default async function InstructorCourseEditPage({ params }: { params: Promise<{ lang: string, courseId: string }> }) {
  const { lang, courseId } = await params
  const session = await auth()
  
  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  // Fetch course and verify ownership
  const courses = await sql`
    SELECT 
      c.*,
      cat.name_en as category_name
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE c.id = ${courseId} AND c.instructor_id = ${session.user.id}
    LIMIT 1
  `

  if (courses.length === 0) {
    notFound()
  }

  const course = courses[0]
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
