"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, GripVertical } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface LessonsListProps {
  lessons: any[]
  courseId: string
  lang: string
}

export function LessonsList({ lessons, courseId, lang }: LessonsListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isAr = lang === "ar"

  const handleDelete = async (lessonId: string) => {
    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete lesson")

      toast({
        title: isAr ? "تم بنجاح" : "Success",
        description: isAr ? "تم حذف الدرس بنجاح" : "Lesson deleted successfully",
      })
      
      router.refresh()
    } catch (error) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل حذف الدرس" : "Failed to delete lesson",
        variant: "destructive",
      })
    }
  }

  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20">
        <p className="text-muted-foreground mb-4">{isAr ? "لا توجد دروس بعد. أنشئ درسك الأول للبدء." : "No lessons yet. Create your first lesson to get started."}</p>
        <Button asChild>
          <Link href={`/${lang}/instructor/courses/${courseId}/lessons/new`}>{isAr ? "إنشاء درس" : "Create Lesson"}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table dir={isAr ? "rtl" : "ltr"}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead className={isAr ? "text-right" : "text-left"}>{isAr ? "الترتيب" : "Order"}</TableHead>
            <TableHead className={isAr ? "text-right" : "text-left"}>{isAr ? "العنوان" : "Title"}</TableHead>
            <TableHead className={isAr ? "text-right" : "text-left"}>{isAr ? "النوع" : "Type"}</TableHead>
            <TableHead className={isAr ? "text-right" : "text-left"}>{isAr ? "الحالة" : "Status"}</TableHead>
            <TableHead className={isAr ? "text-right" : "text-left"}>{isAr ? "المدة" : "Duration"}</TableHead>
            <TableHead className={isAr ? "text-right" : "text-left"}>{isAr ? "الإجراءات" : "Actions"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lessons.map((lesson: any) => (
            <TableRow key={lesson.id}>
              <TableCell>
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              </TableCell>
              <TableCell className="font-medium">{lesson.order_index}</TableCell>
              <TableCell>
                <div className="font-medium">{lang === "ar" ? lesson.title_ar : lesson.title_en}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{lesson.slug}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {lesson.content_type === "video" && (isAr ? "فيديو" : "Video")}
                  {lesson.content_type === "article" && (isAr ? "مقال" : "Article")}
                  {lesson.content_type === "quiz" && (isAr ? "اختبار" : "Quiz")}
                  {lesson.content_type === "assignment" && (isAr ? "واجب" : "Assignment")}
                  {!["video", "article", "quiz", "assignment"].includes(lesson.content_type) && lesson.content_type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={lesson.status === "published" ? "default" : "secondary"}>
                  {lesson.status === "published" ? (isAr ? "منشور" : "Published") : (isAr ? "مسودة" : "Draft")}
                </Badge>
              </TableCell>
              <TableCell>{lesson.duration_minutes ? `${lesson.duration_minutes} ${isAr ? "دقيقة" : "min"}` : "-"}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${lang}/instructor/courses/${courseId}/lessons/${lesson.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className={isAr ? "text-right" : "text-left"}>{isAr ? "هل أنت متأكد؟" : "Are you sure?"}</AlertDialogTitle>
                        <AlertDialogDescription className={isAr ? "text-right" : "text-left"}>
                          {isAr ? "لا يمكن التراجع عن هذا الإجراء. سيتم حذف الدرس نهائيًا." : "This action cannot be undone. This will permanently delete the lesson."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className={isAr ? "flex-row-reverse space-x-reverse" : ""}>
                        <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(lesson.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {isAr ? "حذف" : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
