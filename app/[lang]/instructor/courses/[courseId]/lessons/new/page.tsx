import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { InstructorLessonForm } from "@/components/instructor/lesson-form"
import { db } from "@/lib/db"
import { courses } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getCourseModules, getCourseQuizzes } from "@/lib/db/queries"

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
  const isAr = lang === "ar"
  
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

  const [modules, quizzes] = await Promise.all([
    getCourseModules(courseId),
    getCourseQuizzes(courseId, session.user.id)
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{isAr ? "إنشاء درس" : "Create Lesson"}</h1>
        <p className="text-muted-foreground">{isAr ? "إضافة درس جديد للدورة" : "Add a new lesson to your course."}</p>
      </div>
      <div className="max-w-2xl">
        <InstructorLessonForm 
          courseId={courseId} 
          lang={lang} 
          moduleId={moduleId} 
          modules={modules}
          quizzes={quizzes}
        />
      </div>
    </div>
  )
}
