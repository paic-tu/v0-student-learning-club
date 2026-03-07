import { db } from "@/lib/db"
import { challenges } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getAdminQuizzesAction } from "@/lib/actions/challenge"
import { DeleteQuizButton } from "@/components/instructor/delete-quiz-button"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminQuizzesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const isAr = lang === "ar"
  const session = await auth()
  
  if (!session?.user || session.user.role !== "admin") {
    redirect(`/${lang}/auth/login`)
  }

  const { quizzes, error } = await getAdminQuizzesAction()

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{isAr ? "إدارة الكويزات" : "Quizzes Management"}</h1>
          <p className="text-muted-foreground">
            {isAr ? "إدارة جميع الكويزات والاختبارات القصيرة" : "Manage all quizzes and short tests"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/admin/quizzes/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {isAr ? "إضافة كويز" : "Add Quiz"}
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
              <TableHead>{isAr ? "الدورة" : "Course"}</TableHead>
              <TableHead>{isAr ? "المدرب" : "Instructor"}</TableHead>
              <TableHead>{isAr ? "الصعوبة" : "Difficulty"}</TableHead>
              <TableHead>{isAr ? "النقاط" : "Points"}</TableHead>
              <TableHead className="text-right">{isAr ? "الإجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes?.map((quiz) => (
              <TableRow key={quiz.id}>
                <TableCell className="font-medium">
                  {isAr ? quiz.titleAr : quiz.titleEn}
                </TableCell>
                <TableCell>
                  {quiz.course ? (isAr ? quiz.course.titleAr : quiz.course.titleEn) : "-"}
                </TableCell>
                <TableCell>
                    {quiz.instructor?.name || quiz.instructor?.email || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    quiz.difficulty === 'beginner' ? 'default' : 
                    quiz.difficulty === 'intermediate' ? 'secondary' : 'destructive'
                  }>
                    {quiz.difficulty}
                  </Badge>
                </TableCell>
                <TableCell>{quiz.points}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/${lang}/admin/quizzes/${quiz.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteQuizButton quizId={quiz.id} isAr={isAr} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!quizzes || quizzes.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {isAr ? "لا توجد كويزات" : "No quizzes found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
