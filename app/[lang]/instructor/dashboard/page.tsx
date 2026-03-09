import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Users, BarChart, Star } from "lucide-react"
import { getInstructorAnalytics, getInstructorReviews, getInstructorCoursePerformance } from "@/lib/db/queries"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function InstructorDashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const user = await getCurrentUser()

  if (!user || user.role !== "instructor") {
    redirect(`/${lang}/dashboard`)
  }

  const analytics = await getInstructorAnalytics(user?.id!)
  const recentReviews = await getInstructorReviews(user?.id!)
  const coursePerformance = await getInstructorCoursePerformance(user?.id!)
  const isAr = lang === "ar"

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{isAr ? "لوحة تحكم المدرب" : "Instructor Dashboard"}</h1>
        <Button asChild>
          <Link href={`/${lang}/instructor/courses/new`}>{isAr ? "إنشاء دورة جديدة" : "Create New Course"}</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "دوراتي" : "My Courses"}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCourses}</div>
            <p className="text-xs text-muted-foreground">{isAr ? "الدورات المنشورة" : "Published courses"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "إجمالي الطلاب" : "Total Students"}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalStudents}</div>
            <p className="text-xs text-muted-foreground">{isAr ? "التسجيلات النشطة" : "Active enrollments"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "الإيرادات" : "Revenue"}</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Number(analytics.totalRevenue || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الأرباح" : "Total earnings"}</p>
          </CardContent>
        </Card>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{isAr ? "أداء الدورات (أفضل 5)" : "Course Performance (Top 5)"}</CardTitle>
          </CardHeader>
          <CardContent>
            {coursePerformance.length === 0 ? (
              <p className="text-muted-foreground">{isAr ? "لا توجد بيانات متاحة." : "No data available."}</p>
            ) : (
              <div className="space-y-8">
                {coursePerformance.map((course: any) => (
                  <div key={course.id} className="flex items-center">
                    <div className="ml-4 space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{isAr ? course.titleAr : course.titleEn}</p>
                      <p className="text-xs text-muted-foreground">
                        {isAr ? "تقييم: " : "Rating: "} {course.rating || "N/A"}
                      </p>
                    </div>
                    <div className="ml-auto font-medium flex flex-col items-end gap-1">
                      <span>${Number(course.revenue).toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">
                        {course.enrollment_count} {isAr ? "طالب" : "students"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{isAr ? "أحدث المراجعات" : "Recent Reviews"}</CardTitle>
          </CardHeader>
          <CardContent>
             {recentReviews.length === 0 ? (
               <p className="text-muted-foreground">{isAr ? "لا توجد مراجعات حتى الآن." : "No reviews yet."}</p>
             ) : (
               <div className="space-y-4">
                 {recentReviews.slice(0, 5).map((review: any) => (
                   <div key={review.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                     <Avatar className="w-8 h-8">
                       <AvatarImage src={review.user_avatar || "/default-avatar.svg"} />
                       <AvatarFallback>{review.user_name?.[0] || "U"}</AvatarFallback>
                     </Avatar>
                     <div className="flex-1 space-y-1">
                       <div className="flex items-center justify-between">
                         <p className="text-sm font-medium">{review.user_name}</p>
                         <div className="flex items-center text-xs text-muted-foreground">
                           <Star className="w-3 h-3 fill-primary text-primary mr-1" />
                           {review.rating}
                         </div>
                       </div>
                       <p className="text-xs text-muted-foreground line-clamp-2">{review.comment}</p>
                       <p className="text-xs text-muted-foreground mt-1">
                         {isAr ? review.course_title_ar : review.course_title_en}
                       </p>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
