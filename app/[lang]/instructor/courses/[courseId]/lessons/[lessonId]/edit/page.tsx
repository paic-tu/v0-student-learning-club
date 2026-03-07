import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { InstructorLessonForm } from "@/components/instructor/lesson-form"
import { db } from "@/lib/db"
import { courses, lessons } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getCourseModules } from "@/lib/db/queries"

export default async function EditInstructorLessonPage({ params }: { params: Promise<{ lang: string, courseId: string, lessonId: string }> }) {
  const { lang, courseId, lessonId } = await params
  const session = await auth()
  
  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  // Verify course ownership
  const course = await db.query.courses.findFirst({
    where: and(
      eq(courses.id, courseId),
      eq(courses.instructorId, session.user.id)
    ),
    columns: { id: true }
  })

  if (!course) {
    notFound()
  }

  // Fetch lesson
  const lesson = await db.query.lessons.findFirst({
    where: and(
      eq(lessons.id, lessonId),
      eq(lessons.courseId, courseId)
    )
  })

  if (!lesson) {
    notFound()
  }

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
