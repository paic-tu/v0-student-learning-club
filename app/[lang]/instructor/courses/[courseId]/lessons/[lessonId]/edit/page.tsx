import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { InstructorLessonForm } from "@/components/instructor/lesson-form"
import { neon } from "@neondatabase/serverless"
import { getCourseModules } from "@/lib/db/queries"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

export default async function EditInstructorLessonPage({ params }: { params: Promise<{ lang: string, courseId: string, lessonId: string }> }) {
  const { lang, courseId, lessonId } = await params
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

  // Fetch lesson
  const lessons = await sql`
    SELECT * FROM lessons
    WHERE id = ${lessonId} AND course_id = ${courseId}
    LIMIT 1
  `

  if (lessons.length === 0) {
    notFound()
  }

  const lesson = lessons[0]
  const modules = await getCourseModules(courseId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Edit Lesson</h1>
        <p className="text-muted-foreground">Update your lesson content.</p>
      </div>
      <div className="max-w-2xl">
        <InstructorLessonForm 
          courseId={courseId} 
          lessonId={lessonId}
          initialData={lesson} 
          lang={lang} 
          modules={modules}
        />
      </div>
    </div>
  )
}
