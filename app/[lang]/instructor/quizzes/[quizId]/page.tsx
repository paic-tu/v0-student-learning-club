import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getInstructorCoursesAction } from "@/lib/actions/course"
import { getInstructorQuizAction } from "@/lib/actions/challenge"
import { InstructorQuizForm } from "@/components/instructor/quiz-form"

export default async function EditQuizPage({ params }: { params: Promise<{ lang: string; quizId: string }> }) {
  const { lang, quizId } = await params
  const session = await auth()
  const isAr = lang === "ar"

  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  // Fetch quiz and courses in parallel
  const [quizResult, coursesResult] = await Promise.all([
    getInstructorQuizAction(quizId),
    getInstructorCoursesAction()
  ])

  if (quizResult.error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          {isAr ? "حدث خطأ أثناء تحميل الكويز" : quizResult.error}
        </div>
      </div>
    )
  }

  if (coursesResult.error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          {isAr ? "حدث خطأ أثناء تحميل الدورات" : coursesResult.error}
        </div>
      </div>
    )
  }

  const quiz = quizResult.quiz
  
  // Transform quiz data for the form
  const initialData = {
    titleEn: quiz.titleEn,
    titleAr: quiz.titleAr,
    descriptionEn: quiz.descriptionEn,
    descriptionAr: quiz.descriptionAr,
    courseId: quiz.courseId,
    difficulty: quiz.difficulty,
    timeLimit: quiz.timeLimit || 15,
    points: quiz.points,
    questions: (quiz.testCases as any[]) || [
      {
        question: "",
        options: ["", "", "", ""],
        answer: 0,
        points: 1
      }
    ]
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{isAr ? "تعديل الكويز" : "Edit Quiz"}</h1>
        <p className="text-muted-foreground mt-2">
          {isAr ? "تعديل تفاصيل الكويز والأسئلة" : "Edit quiz details and questions"}
        </p>
      </div>

      <InstructorQuizForm 
        initialData={initialData}
        quizId={quizId}
        lang={lang} 
        courses={coursesResult.courses || []} 
      />
    </div>
  )
}
