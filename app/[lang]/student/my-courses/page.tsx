import { getCurrentUser } from "@/lib/auth"
import { getStudentCourses } from "@/lib/db/queries"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, PlayCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export default async function MyCoursesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const user = await getCurrentUser()
  
  if (!user || user.role !== "student") {
    // handled by middleware
    return null
  }

  const courses = await getStudentCourses(user.id)
  const isAr = lang === "ar"

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{isAr ? "دوراتي" : "My Courses"}</h1>
        <Button asChild variant="outline">
          <Link href={`/${lang}/student/browse`}>{isAr ? "تصفح المزيد" : "Browse More"}</Link>
        </Button>
      </div>

      {courses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((enrollment: any) => (
            <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative bg-muted">
                {enrollment.course.thumbnailUrl ? (
                  <img 
                    src={enrollment.course.thumbnailUrl} 
                    alt={isAr ? enrollment.course.titleAr : enrollment.course.titleEn} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Button variant="secondary" size="lg" className="gap-2" asChild>
                     <Link href={`/${lang}/student/course/${enrollment.courseId}`}>
                       <PlayCircle className="h-5 w-5" />
                       {isAr ? "متابعة" : "Continue"}
                     </Link>
                   </Button>
                </div>
              </div>
              <CardContent className="p-5 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {isAr ? enrollment.course.titleAr : enrollment.course.titleEn}
                    </h3>
                    {enrollment.progress === 100 && (
                      <Badge className="bg-green-500 hover:bg-green-600">Done</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {enrollment.course.instructor.name}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{isAr ? "التقدم" : "Progress"}</span>
                    <span>{enrollment.progress}%</span>
                  </div>
                  <Progress value={enrollment.progress} className="h-2" />
                </div>

                <div className="pt-2">
                  <Button className="w-full" asChild>
                    <Link href={`/${lang}/student/course/${enrollment.courseId}`}>
                      {isAr ? "الذهاب للدرس" : "Go to Course"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{isAr ? "لا توجد دورات بعد" : "No courses yet"}</h2>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              {isAr 
                ? "ابدأ رحلتك التعليمية اليوم واستكشف مئات الدورات المتاحة" 
                : "Start your learning journey today and explore hundreds of available courses"}
            </p>
            <Button size="lg" asChild>
              <Link href={`/${lang}/student/browse`}>
                {isAr ? "تصفح الدورات" : "Explore Courses"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
