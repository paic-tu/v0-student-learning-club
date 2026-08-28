import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getInstructorCoursesAction } from "@/lib/actions/course"
import { getCourseById } from "@/lib/db/queries"
import { InstructorQuizForm } from "@/components/instructor/quiz-form"
import { InstructorCourseShell } from "@/components/instructor/course-shell"

export default async function NewQuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ courseId?: string }>
}) {
  const { lang } = await params
  const { courseId } = await searchParams
  const session = await auth()
  const isAr = lang === "ar"

  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  const { courses, error } = await getInstructorCoursesAction()

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          {isAr ? "حدث خطأ أثناء تحميل الدورات" : "Error loading courses"}
        </div>
      </div>
    )
  }

  const content = (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{isAr ? "إنشاء كويز جديد" : "Create New Quiz"}</h1>
        <p className="text-muted-foreground mt-2">
          {isAr ? "أضف كويز جديد وقم بربطه بإحدى دوراتك" : "Add a new quiz and link it to one of your courses"}
        </p>
      </div>

      <InstructorQuizForm
        lang={lang}
        courses={courses || []}
        lockedCourseId={courseId}
        redirectTo={courseId ? `/${lang}/instructor/courses/${courseId}/quizzes` : undefined}
      />
    </div>
  )

  if (courseId) {
    const course = await getCourseById(courseId)
    if (!course) redirect(`/${lang}/instructor/courses`)
    if (course.instructorId !== session.user.id && session.user.role !== "admin") {
      redirect(`/${lang}/access-denied`)
    }

    return (
      <InstructorCourseShell course={course} lang={lang} courseId={courseId}>
        {content}
      </InstructorCourseShell>
    )
  }

  return content
}
