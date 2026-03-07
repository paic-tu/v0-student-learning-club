import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getInstructorCourses } from "@/lib/db/queries"
import { redirect } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, Star } from "lucide-react"

export default async function InstructorCoursesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()
  const isAr = lang === "ar"
  
  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  const courses = await getInstructorCourses(session.user.id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{isAr ? "دوراتي" : "My Courses"}</h1>
          <p className="text-muted-foreground mt-2">{isAr ? "إدارة الدورات الخاصة بك وتتبع تقدم الطلاب" : "Manage your courses and track student progress"}</p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/instructor/courses/new`}>{isAr ? "إنشاء دورة جديدة" : "Create New Course"}</Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "لم يتم العثور على دورات" : "No courses found"}</CardTitle>
            <CardDescription>{isAr ? "لم تقم بإنشاء أي دورات بعد." : "You have not created any courses yet."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/${lang}/instructor/courses/new`}>{isAr ? "ابدأ الآن" : "Get Started"}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
              <div className="relative aspect-video w-full bg-muted">
                {course.thumbnailUrl ? (
                  <Image 
                    src={course.thumbnailUrl} 
                    alt={isAr ? course.titleAr : course.titleEn}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-secondary text-secondary-foreground">
                    {isAr ? "لا توجد صورة" : "No Image"}
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={course.isPublished ? "default" : "secondary"}>
                    {course.isPublished 
                      ? (isAr ? "منشور" : "Published") 
                      : (isAr ? "مسودة" : "Draft")}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">
                  {isAr ? course.titleAr : course.titleEn}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {isAr ? course.descriptionAr : course.descriptionEn}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{course.enrollmentCount || 0} {isAr ? "طالب" : "Students"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{course.rating || "0.0"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/${lang}/instructor/courses/${course.id}/edit`}>{isAr ? "تعديل" : "Edit"}</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href={`/${lang}/instructor/courses/${course.id}/edit`}>{isAr ? "إدارة" : "Manage"}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
