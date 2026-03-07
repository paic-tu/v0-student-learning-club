import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Trophy, Award, PlayCircle, Clock } from "lucide-react"
import { getStudentDashboardData } from "@/lib/db/queries"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export default async function StudentDashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const user = await getCurrentUser()
  
  if (!user || user.role !== "student") {
    // This should be handled by middleware but as a safeguard
    // redirect(`/${lang}/auth/login`)
    return null
  }

  const data = await getStudentDashboardData(user.id)
  const isAr = lang === "ar"

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{isAr ? "لوحة التحكم" : "Student Dashboard"}</h1>
          <p className="text-muted-foreground">{isAr ? `مرحباً بك، ${user.name}` : `Welcome back, ${user.name}`}</p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/student/browse`}>{isAr ? "تصفح الدورات" : "Browse Courses"}</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "الدورات المسجلة" : "Enrolled Courses"}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.activeCourses}</div>
            <p className="text-xs text-muted-foreground">{isAr ? "دورات نشطة" : "Active courses"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "الدورات المكتملة" : "Completed"}</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.completedCourses}</div>
            <p className="text-xs text-muted-foreground">{isAr ? "تم إنجازها" : "Courses finished"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "الشهادات" : "Certificates"}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.certificates}</div>
            <p className="text-xs text-muted-foreground">{isAr ? "شهادة مكتسبة" : "Earned certificates"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Resume Learning */}
      {data.lastActivity && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              {isAr ? "استئناف التعلم" : "Continue Learning"}
            </CardTitle>
            <CardDescription>
              {isAr ? "أنت تشاهد حالياً:" : "You were watching:"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1 w-full">
              <h3 className="font-semibold text-lg">{isAr ? data.lastActivity.courseTitleAr : data.lastActivity.courseTitleEn}</h3>
              <p className="text-sm text-muted-foreground">{isAr ? data.lastActivity.lessonTitleAr : data.lastActivity.lessonTitleEn}</p>
              <div className="w-full max-w-md mt-2">
                 <Progress value={data.lastActivity.progress || 0} className="h-2" />
                 <span className="text-xs text-muted-foreground mt-1 inline-block">{data.lastActivity.progress}% completed</span>
              </div>
            </div>
            <Button asChild size="lg" className="w-full md:w-auto">
              <Link href={`/${lang}/student/learn/${data.lastActivity.courseId}/${data.lastActivity.lessonId}`}>
                {isAr ? "متابعة الدرس" : "Resume Lesson"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{isAr ? "دوراتي" : "My Courses"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.enrolledCourses?.length > 0 ? (
              <div className="space-y-4">
                {data.enrolledCourses.map((enrollment: any) => (
                  <div key={enrollment.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    {enrollment.course.thumbnailUrl ? (
                      <img 
                        src={enrollment.course.thumbnailUrl} 
                        alt={isAr ? enrollment.course.titleAr : enrollment.course.titleEn} 
                        className="w-24 h-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-24 h-16 bg-muted rounded-md flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between">
                         <h4 className="font-semibold line-clamp-1">
                            {isAr ? enrollment.course.titleAr : enrollment.course.titleEn}
                         </h4>
                         {enrollment.progress === 100 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
                         )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {enrollment.course.instructor.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Progress value={enrollment.progress} className="h-1.5 w-24" />
                        <span>{enrollment.progress}%</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                       <Link href={`/${lang}/student/course/${enrollment.courseId}`}>
                          {isAr ? "عرض" : "View"}
                       </Link>
                    </Button>
                  </div>
                ))}
                <Button variant="link" className="w-full" asChild>
                  <Link href={`/${lang}/student/my-courses`}>
                    {isAr ? "عرض كل الدورات" : "View All Courses"}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  {isAr ? "لست مسجلاً في أي دورة بعد" : "You are not enrolled in any courses yet."}
                </p>
                <Button asChild variant="outline">
                  <Link href={`/${lang}/student/browse`}>
                    {isAr ? "تصفح الدورات" : "Browse Courses"}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{isAr ? "توصيات لك" : "Recommended for You"}</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground text-center py-8">
               {isAr ? "لا توجد توصيات حالياً" : "No recommendations yet."}
             </p>
             {/* Placeholder for recommendations logic */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
