import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getInstructorCourses } from "@/lib/db/queries"
import { redirect } from "next/navigation"
import { LiveCourseCard } from "./live-course-card"

export default async function InstructorLiveCoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ room?: string }>
}) {
  const { lang } = await params
  const { room } = await searchParams
  const session = await auth()
  const isAr = lang === "ar"
  
  if (!session?.user?.id) {
    redirect(`/${lang}/auth/login`)
  }

  const role = (session.user as any).role || "student"
  const canManageCourses = role === "instructor" || role === "admin"

  if (room === "consultation-tech") {
    redirect(`/${lang}/instructor/consultations?room=consultation-tech`)
  }

  const liveCourses = canManageCourses
    ? (await getInstructorCourses(session.user.id)).filter((c) => c.isLive)
    : []

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{isAr ? "الاستشارات التقنية" : "Technical Consultations"}</h1>
          <p className="text-muted-foreground mt-2">
            {isAr
              ? "جلسات مباشرة للجميع بدون الحاجة للتسجيل في دورة"
              : "Live sessions for everyone without course enrollment"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "استشارة تقنية مباشرة" : "Live Tech Consultation"}</CardTitle>
          <CardDescription>
            {isAr
              ? "ادخل الغرفة واطرح سؤالك، ويمكنك رفع اليد للتحدث."
              : "Join the room, ask your question, and raise your hand to speak."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <Link href={`/${lang}/instructor/consultations?room=consultation-tech`}>
              {isAr ? "دخول الاستشارة" : "Join Consultation"}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {canManageCourses && (liveCourses.length === 0 ? (
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
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{isAr ? "الدورات المباشرة" : "Live Courses"}</h2>
            <p className="text-muted-foreground mt-1">
              {isAr ? "إدارة الدورات المباشرة وبدء البث" : "Manage live courses and start streaming"}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveCourses.map((course) => (
              <LiveCourseCard key={course.id} course={course} isAr={isAr} lang={lang} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
