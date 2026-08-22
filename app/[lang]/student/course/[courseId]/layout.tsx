import type { ReactNode } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getCourseById, getEnrollment, checkEnrollmentStatus } from "@/lib/db/queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CourseShell } from "@/components/student/course/course-shell"

export default async function CourseShellLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string; courseId: string }>
}) {
  const { lang, courseId } = await params
  const isAr = lang === "ar"
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${lang}/auth/login?callbackUrl=/${lang}/student/course/${courseId}`)
  }

  const userId = session.user.id
  const userRole = session.user.role
  const isPreviewRole = userRole === "instructor" || userRole === "admin"

  const [course, enrollment, isEnrolledOk] = await Promise.all([
    getCourseById(courseId),
    getEnrollment(userId, courseId),
    checkEnrollmentStatus(userId, courseId),
  ])

  if (!course) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>{isAr ? "الكورس غير موجود" : "Course not found"}</CardTitle>
            <CardDescription>
              {isAr
                ? "الرابط اللي فتحته غير صحيح أو تم حذف الكورس."
                : "This link is invalid or the course has been removed."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/${lang}/student/dashboard`}>
                {isAr ? "العودة لبوابة الطالب" : "Back to Student Portal"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isPreviewRole && (!enrollment || !isEnrolledOk)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>{isAr ? "أنت غير مسجل بهذا الكورس" : "You're not enrolled in this course"}</CardTitle>
            <CardDescription>
              {isAr
                ? "تحتاج تسجل بالكورس عشان توصل لمحتواه."
                : "You need to enroll in this course to access its content."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild>
              <Link href={`/${lang}/courses/${courseId}`}>
                {isAr ? "عرض صفحة الكورس" : "View Course Page"}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${lang}/student/dashboard`}>
                {isAr ? "العودة لبوابة الطالب" : "Back to Student Portal"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <CourseShell
      lang={lang}
      courseId={courseId}
      course={{
        titleAr: course.titleAr,
        titleEn: course.titleEn,
        thumbnailUrl: course.thumbnailUrl,
      }}
      progress={enrollment?.progress ?? 0}
    >
      {children}
    </CourseShell>
  )
}
