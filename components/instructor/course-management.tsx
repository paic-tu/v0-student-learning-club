"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CourseEditForm } from "@/components/admin/course-edit-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Trash2, Users, BookOpen, Star } from "lucide-react"
import { deleteCourseAction } from "@/lib/actions/course"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
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

interface CourseManagementProps {
  course: any
  categories: any[]
  instructors: any[]
  lang: string
  enrollments: any[]
  stats?: {
    totalStudents: number
    rating: number
    reviews: number
  }
}

export function CourseManagement({
  course,
  categories,
  instructors,
  lang,
  enrollments,
  stats
}: CourseManagementProps) {
  const isAr = lang === "ar"
  const { toast } = useToast()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredEnrollments = enrollments.filter(enrollment => 
    enrollment.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(enrollment.user.phoneNumber || enrollment.user.phone || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteCourse = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteCourseAction(course.id)
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
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "إجمالي الطلاب" : "Total Students"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "التقييم" : "Rating"}
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rating || "0.0"}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.reviews || 0} {isAr ? "مراجعة" : "reviews"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "الحالة" : "Status"}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={course.is_published ? "default" : "secondary"}>
              {course.is_published 
                ? (isAr ? "منشور" : "Published") 
                : (isAr ? "مسودة" : "Draft")}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="w-full" dir={isAr ? "rtl" : "ltr"}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="settings">{isAr ? "الإعدادات" : "Settings"}</TabsTrigger>
          <TabsTrigger value="students">{isAr ? "الطلاب" : "Students"}</TabsTrigger>
          <TabsTrigger value="manage">{isAr ? "إدارة" : "Manage"}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="mt-6">
          <CourseEditForm 
            course={course} 
            categories={categories} 
            instructors={instructors} 
            lang={lang}
          />
        </TabsContent>
        
        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "الطلاب المسجلين" : "Enrolled Students"}</CardTitle>
              <CardDescription>
                {isAr ? "قائمة بالطلاب المسجلين في هذه الدورة" : "List of students enrolled in this course"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                <Input 
                  placeholder={isAr ? "بحث عن طالب..." : "Search students..."} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">{isAr ? "الصورة" : "Avatar"}</TableHead>
                      <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                      <TableHead>{isAr ? "البريد الإلكتروني" : "Email"}</TableHead>
                      <TableHead>{isAr ? "رقم الجوال" : "Phone"}</TableHead>
                      <TableHead>{isAr ? "تاريخ التسجيل" : "Joined Date"}</TableHead>
                      <TableHead>{isAr ? "التقدم" : "Progress"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrollments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {isAr ? "لا يوجد طلاب" : "No students found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEnrollments.map((enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell>
                            <Avatar>
                              <AvatarImage src={enrollment.user.avatarUrl} />
                              <AvatarFallback>{enrollment.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">{enrollment.user.name}</TableCell>
                          <TableCell>{enrollment.user.email}</TableCell>
                          <TableCell>{enrollment.user.phoneNumber || enrollment.user.phone || "-"}</TableCell>
                          <TableCell>
                            {new Date(enrollment.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={enrollment.progress === 100 ? "default" : "secondary"}>
                              {enrollment.progress}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manage" className="mt-6">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">{isAr ? "منطقة الخطر" : "Danger Zone"}</CardTitle>
              <CardDescription>
                {isAr ? "الإجراءات هنا لا يمكن التراجع عنها" : "Actions here cannot be undone"}
              </CardDescription>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
