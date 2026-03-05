import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { InstructorLessonForm } from "@/components/instructor/lesson-form"
import { neon } from "@neondatabase/serverless"
import { getCourseModules } from "@/lib/db/queries"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

export default async function NewInstructorLessonPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ lang: string, courseId: string }>,
  searchParams: Promise<{ moduleId?: string }> 
}) {
  const { lang, courseId } = await params
  const { moduleId } = await searchParams
  const session = await auth()
  
  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  // Verify course ownership
  const courses = await sql`
    SELECT id FROM courses 
    WHERE id = ${courseId} AND instructor_id = ${session.user.id}
    LIMIT 1
  `

  if (courses.length === 0) {
    notFound()
  }

  const modules = await getCourseModules(courseId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Create Lesson</h1>
        <p className="text-muted-foreground">Add a new lesson to your course.</p>
      </div>
      <div className="max-w-2xl">
        <InstructorLessonForm 
          courseId={courseId} 
          lang={lang} 
          moduleId={moduleId} 
          modules={modules}
        />
      </div>
    </div>
  )
}
