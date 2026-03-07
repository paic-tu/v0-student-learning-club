import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getInstructorQuizzesAction } from "@/lib/actions/challenge"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, CheckCircle, HelpCircle, Edit, Trash2 } from "lucide-react"
import { DeleteQuizButton } from "@/components/instructor/delete-quiz-button"

export default async function InstructorQuizzesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()
  const isAr = lang === "ar"
  
  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  const { quizzes, error } = await getInstructorQuizzesAction()

  if (error) {
    return <div>Error loading quizzes</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{isAr ? "الكويزات" : "Quizzes"}</h1>
          <p className="text-muted-foreground mt-2">{isAr ? "إدارة الكويزات والاختبارات القصيرة" : "Manage your quizzes and short tests"}</p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/instructor/quizzes/new`}>
            <HelpCircle className="mr-2 h-4 w-4" />
            {isAr ? "إنشاء كويز جديد" : "Create New Quiz"}
          </Link>
        </Button>
      </div>

      {(!quizzes || quizzes.length === 0) ? (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "لم يتم العثور على كويزات" : "No quizzes found"}</CardTitle>
            <CardDescription>{isAr ? "لم تقم بإنشاء أي كويزات بعد." : "You have not created any quizzes yet."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/${lang}/instructor/quizzes/new`}>{isAr ? "ابدأ الآن" : "Get Started"}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
              <CardHeader className="bg-muted/50 pb-4">
                <div className="flex justify-between items-start">
                  <Badge variant={quiz.isActive ? "default" : "secondary"}>
                    {quiz.isActive 
                      ? (isAr ? "نشط" : "Active") 
                      : (isAr ? "غير نشط" : "Inactive")}
                  </Badge>
                  <Badge variant="outline">{quiz.difficulty}</Badge>
                </div>
                <CardTitle className="line-clamp-1 mt-2">
                  {isAr ? quiz.titleAr : quiz.titleEn}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {isAr ? quiz.descriptionAr : quiz.descriptionEn}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4 pt-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>{quiz.points} {isAr ? "نقطة" : "Points"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HelpCircle className="h-4 w-4" />
                    <span>{(quiz.testCases as any[])?.length || 0} {isAr ? "سؤال" : "Questions"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/${lang}/instructor/quizzes/${quiz.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      {isAr ? "تعديل" : "Edit"}
                    </Link>
                  </Button>
                  <DeleteQuizButton quizId={quiz.id} isAr={isAr} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
