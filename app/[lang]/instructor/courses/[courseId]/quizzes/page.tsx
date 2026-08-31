import { db } from "@/lib/db"
import { challenges } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DeleteQuizButton } from "@/components/instructor/delete-quiz-button"
import Link from "next/link"
import { HelpCircle, CheckCircle, PlusCircle, Pencil } from "lucide-react"

export default async function InstructorCourseQuizzesPage({
  params,
}: {
  params: Promise<{ lang: string; courseId: string }>
}) {
  const { lang, courseId } = await params
  const isAr = lang === "ar"

  const quizzes = await db.query.challenges.findMany({
    where: and(eq(challenges.type, "quiz"), eq(challenges.courseId, courseId)),
    orderBy: [desc(challenges.createdAt)],
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAr ? "الكويزات" : "Quizzes"}</h1>
        <Button asChild>
          <Link href={`/${lang}/instructor/quizzes/new?courseId=${courseId}`}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {isAr ? "إنشاء كويز جديد" : "Create New Quiz"}
          </Link>
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {isAr ? "لا توجد كويزات بعد." : "No quizzes yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {quizzes.map((quiz) => {
            const questionCount = Array.isArray(quiz.testCases) ? (quiz.testCases as any[]).length : 0
            return (
              <Card key={quiz.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{isAr ? quiz.titleAr || quiz.titleEn : quiz.titleEn || quiz.titleAr}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {quiz.points} {isAr ? "نقطة" : "pts"}
                      </span>
                      <span>{questionCount} {isAr ? "سؤال" : "questions"}</span>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {quiz.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={quiz.isActive ? "default" : "secondary"} className="shrink-0">
                    {quiz.isActive ? (isAr ? "نشط" : "Active") : isAr ? "غير نشط" : "Inactive"}
                  </Badge>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${lang}/instructor/quizzes/${quiz.id}/edit`} aria-label={isAr ? "تعديل" : "Edit"}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <DeleteQuizButton quizId={quiz.id} isAr={isAr} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
