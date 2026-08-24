"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { deleteCourseAction } from "@/lib/actions/course"
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

interface CourseDangerZoneProps {
  lang: string
  courseId: string
}

export function CourseDangerZone({ lang, courseId }: CourseDangerZoneProps) {
  const isAr = lang === "ar"
  const { toast } = useToast()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteCourse = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteCourseAction(courseId)
      if (result.error) {
        toast({
          title: isAr ? "خطأ" : "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: isAr ? "تم الحذف" : "Deleted",
          description: isAr ? "تم حذف الدورة بنجاح" : "Course deleted successfully",
        })
        router.push(`/${lang}/instructor/courses`)
      }
    } catch (error) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "حدث خطأ غير متوقع" : "Unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">{isAr ? "منطقة الخطر" : "Danger Zone"}</CardTitle>
        <CardDescription>{isAr ? "الإجراءات هنا لا يمكن التراجع عنها" : "Actions here cannot be undone"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20 bg-destructive/5">
          <div>
            <h3 className="font-medium text-destructive">{isAr ? "حذف الدورة" : "Delete Course"}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr
                ? "سيتم حذف الدورة وجميع محتوياتها والطلاب المسجلين بها نهائياً."
                : "This will permanently delete the course, all content, and enrollments."}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (isAr ? "جاري الحذف..." : "Deleting...") : (isAr ? "حذف الدورة" : "Delete Course")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{isAr ? "هل أنت متأكد؟" : "Are you sure?"}</AlertDialogTitle>
                <AlertDialogDescription>
                  {isAr
                    ? "هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الدورة وجميع البيانات المرتبطة بها نهائياً."
                    : "This action cannot be undone. This will permanently delete the course and all associated data."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCourse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {isAr ? "نعم، احذف الدورة" : "Yes, delete course"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
