import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getInstructorCourses } from "@/lib/db/queries"
import { redirect } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Users, Video, Clock } from "lucide-react"
import { LiveCourseCard } from "./live-course-card"

export default async function InstructorLiveCoursesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()
  const isAr = lang === "ar"
  
  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  const allCourses = await getInstructorCourses(session.user.id)
  const liveCourses = allCourses.filter(c => c.isLive)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{isAr ? "الدورات المباشرة" : "Live Courses"}</h1>
          <p className="text-muted-foreground mt-2">
            {isAr 
              ? "إدارة الدورات المباشرة وبدء البث" 
              : "Manage live courses and start streaming"}
          </p>
        </div>
      </div>

      {liveCourses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "لا توجد دورات مباشرة" : "No live courses found"}</CardTitle>
            <CardDescription>
              {isAr 
                ? "لم تقم بإنشاء أي دورات مباشرة بعد. قم بإنشاء دورة جديدة واختر 'دورة مباشرة' من الإعدادات." 
                : "You have not created any live courses yet. Create a new course and select 'Live Course' in settings."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/${lang}/instructor/courses/new`}>{isAr ? "إنشاء دورة جديدة" : "Create New Course"}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveCourses.map((course) => (
            <LiveCourseCard key={course.id} course={course} isAr={isAr} lang={lang} />
          ))}
        </div>
      )}
    </div>
  )
}
