import { auth } from "@/lib/auth"
import { getCourseById, getEnrollment, getCourseLessons } from "@/lib/db/queries"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BookOpen, Lock, Users, Video } from "lucide-react"

export default async function StudentCourseEntryPage(props: { params: Promise<{ lang: string; courseId: string }> }) {
  const params = await props.params
  const { lang, courseId } = params

  const session = await auth()
  
  // 1. Validate Session
  if (!session?.user?.id) {
    redirect(`/${lang}/auth/login?callbackUrl=/${lang}/student/course/${courseId}`)
  }

  const userId = session.user.id
  const userRole = session.user.role

  // 2. Validate Role (Allow Admin/Instructor to view as student too, but primarily Student)
  if (userRole !== "student" && userRole !== "admin" && userRole !== "instructor") {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
        <Button asChild className="mt-4">
          <Link href={`/${lang}/`}>Go Home</Link>
        </Button>
      </div>
    )
  }

  // 3. Fetch Course & Enrollment
  const [course, enrollment] = await Promise.all([
    getCourseById(courseId),
    getEnrollment(userId, courseId)
  ])

  if (!course) {
    notFound()
  }

  // 4. Handle Not Enrolled
  if (!enrollment) {
    if (userRole === "instructor" || userRole === "admin") {
       // Allow access without enrollment (preview mode)
       // Mock empty enrollment data if needed, or handle null downstream
    } else {
       // Redirect to public course page for enrollment
       redirect(`/${lang}/courses/${courseId}`)
    }
  }

  // 5. Determine Next Lesson
  const lessons = await getCourseLessons(courseId)

  if (course.isLive) {
    const isStreaming = (course as any).isStreaming
    return (
      <div className="container mx-auto py-10 max-w-2xl">
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{lang === "ar" ? "دورة مباشرة" : "Live Course"}</CardTitle>
              {isStreaming && (
                <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            <CardDescription className="text-lg mt-2">
              {isStreaming 
                ? (lang === "ar" ? "البث المباشر جارٍ الآن!" : "Live stream is active now!")
                : (lang === "ar" ? "لم يتم بدء البث المباشر بعد." : "The live stream has not started yet.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {lang === "ar" ? "المسجلين في الدورة: " : "Registered Students: "}
                  {course.enrollmentCount || 0}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {lang === "ar" ? "الحالة: " : "Status: "}
                  {isStreaming 
                    ? (lang === "ar" ? "مباشر الآن 🔴" : "Live Now 🔴") 
                    : (lang === "ar" ? "في انتظار البث ⏳" : "Waiting for Stream ⏳")}
                </span>
              </div>
            </div>
            
            <Button 
              className="w-full gap-2 text-lg h-12" 
              asChild 
              size="lg"
              disabled={!isStreaming && userRole === "student"}
            >
              <Link href={`/${lang}/student/course/${courseId}/live`}>
                <Video className="h-5 w-5" />
                {lang === "ar" ? "دخول البث المباشر" : "Join Live Session"}
              </Link>
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <Link href={`/${lang}/student/dashboard`}>
                {lang === "ar" ? "العودة للوحة التحكم" : "Back to Dashboard"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!lessons || lessons.length === 0) {
    return (
      <div className="container mx-auto py-10 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{lang === "ar" ? "قريباً" : "Coming Soon"}</CardTitle>
            <CardDescription>
              {lang === "ar" 
                ? "لم يتم إضافة دروس لهذه الدورة بعد." 
                : "No lessons have been added to this course yet."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/${lang}/student/dashboard`}>
                {lang === "ar" ? "العودة للوحة التحكم" : "Back to Dashboard"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Parse completed lessons safely
  let completedLessonIds: string[] = []
  if (enrollment && enrollment.completedLessons) {
      completedLessonIds = enrollment.completedLessons as string[]
  }

  // Logic: Find the first lesson that is NOT completed
  // If all completed, go to the last lesson (or first)
  // Or if last_accessed_at is recent, maybe go to that one? (Simpler: First uncompleted)
  
  let nextLessonId = lessons[0].id

  // Sort lessons by order_index to be sure
  const sortedLessons = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex)

  const firstUncompleted = sortedLessons.find(l => !completedLessonIds.includes(l.id))

  if (firstUncompleted) {
    nextLessonId = firstUncompleted.id
  } else {
    // All completed? Go to the last one or first one?
    // Let's go to the first one for review
    nextLessonId = sortedLessons[0].id
  }

  // 6. Redirect to Learning Player
  redirect(`/${lang}/student/learn/${courseId}/${nextLessonId}`)
}
