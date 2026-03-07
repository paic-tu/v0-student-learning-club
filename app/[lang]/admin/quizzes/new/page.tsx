import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAllCoursesAction } from "@/lib/actions/course"
import { InstructorQuizForm } from "@/components/instructor/quiz-form"

export default async function NewAdminQuizPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()
  const isAr = lang === "ar"

  if (!session?.user?.id || session.user.role !== "admin") {
    redirect(`/${lang}/auth/login`)
  }

  const { courses, error } = await getAllCoursesAction()

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          {isAr ? "حدث خطأ أثناء تحميل الدورات" : "Error loading courses"}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{isAr ? "إنشاء كويز جديد" : "Create New Quiz"}</h1>
        <p className="text-muted-foreground mt-2">
          {isAr ? "أضف كويز جديد وقم بربطه بإحدى الدورات" : "Add a new quiz and link it to a course"}
        </p>
      </div>

      <InstructorQuizForm 
        lang={lang} 
        courses={courses || []} 
      />
    </div>
  )
}
