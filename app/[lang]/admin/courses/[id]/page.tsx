import { requirePermission } from "@/lib/rbac/require-permission"
import { neon } from "@neondatabase/serverless"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { CourseEditForm } from "@/components/admin/course-edit-form"
import { LessonsList } from "@/components/admin/lessons-list"
import { ModulesList } from "@/components/admin/modules-list"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === "new") {
    redirect("/admin/courses/new")
  }

  await requirePermission("courses:read")

  let courseId: string = id

  if (!courseId || courseId.length < 10) {
    notFound()
  }

  const courses = await sql`
    SELECT 
      c.*,
      u.name as instructor_name,
      cat.name_en as category_name
    FROM courses c
    JOIN users u ON c.instructor_id = u.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE c.id = ${courseId}
    LIMIT 1
  `

  if (courses.length === 0) {
    notFound()
  }

  const course = courses[0]

  const lessons = await sql`
    SELECT * FROM lessons 
    WHERE course_id = ${courseId}
    ORDER BY order_index ASC
  `

  const modules = await sql`
    SELECT * FROM modules
    WHERE course_id = ${courseId}
    ORDER BY order_index ASC
  `

  const categories = await sql`SELECT * FROM categories ORDER BY name_en ASC`
  const instructors =
    await sql`SELECT id, name, email FROM users WHERE role = 'instructor' OR role = 'admin' ORDER BY name ASC`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/courses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{course.title_en}</h1>
          <p className="text-muted-foreground">by {course.instructor_name}</p>
        </div>
        <Badge variant={course.is_published ? "default" : "secondary"} className="ml-auto">
          {course.is_published ? "Published" : "Draft"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseEditForm course={course} categories={categories} instructors={instructors} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modules ({modules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ModulesList modules={modules as any} courseId={courseId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lessons ({lessons.length})</CardTitle>
            <Button size="sm" asChild>
              <Link href={`/admin/courses/${courseId}/lessons/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Lesson
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <LessonsList lessons={lessons} courseId={courseId} />
        </CardContent>
      </Card>
    </div>
  )
}
