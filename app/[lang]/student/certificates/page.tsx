
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getUserCertificates, getStudentCourses } from "@/lib/db/queries"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CertificatesGrid } from "@/components/certificate/certificates-grid"
import { Award, BookOpen } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function CertificatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ highlight?: string }>
}) {
  const { lang } = await params
  const { highlight } = await searchParams
  const user = await getCurrentUser()
  const isAr = lang === "ar"

  if (!user) {
    redirect(`/${lang}/auth/login`)
  }

  // Fetch official certificates
  const certificates = await getUserCertificates(user.id)
  
  // Fetch completed courses
  const allCourses = await getStudentCourses(user.id)
  const completedCourses = allCourses.filter((enrollment: any) => enrollment.progress === 100)

  // Create a set of course IDs that already have certificates
  const certifiedCourseIds = new Set(certificates.map((cert: any) => cert.courseId))

  // Filter completed courses that don't have certificates yet
  const completedCoursesWithoutCert = completedCourses.filter((enrollment: any) => 
    !certifiedCourseIds.has(enrollment.courseId)
  )

  // Combine them for display
  // We'll display official certificates first, then completed courses
  const displayItems = [
    ...certificates.map((cert: any) => ({
      id: cert.id,
      courseId: cert.courseId,
      titleEn: cert.course?.titleEn || cert.titleEn,
      titleAr: cert.course?.titleAr || cert.titleAr,
      instructorName: cert.course?.instructor?.name,
      issuedAt: cert.issuedAt,
      certificateNumber: cert.certificateNumber,
      isOfficial: true
    })),
    ...completedCoursesWithoutCert.map((enrollment: any) => ({
      id: enrollment.id, // enrollment id
      courseId: enrollment.courseId,
      titleEn: enrollment.course.titleEn,
      titleAr: enrollment.course.titleAr,
      instructorName: enrollment.course.instructor.name,
      issuedAt: enrollment.lastAccessedAt || new Date(), // Use last accessed as completion date
      certificateNumber: null,
      isOfficial: false
    }))
  ]

  // Prepare certificates for preview component (needs specific shape)
  const previewCertificates = displayItems.map(item => ({
    id: item.id,
    title_en: item.titleEn,
    title_ar: item.titleAr,
    course_title_en: item.titleEn,
    course_title_ar: item.titleAr,
    certificate_number: item.certificateNumber
  }))

  return (
    <div className="space-y-6 container py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{isAr ? "شهاداتي" : "My Certificates"}</h1>
        <p className="text-muted-foreground">
          {isAr 
            ? "عرض وتحميل الشهادات المكتسبة من الدورات المكتملة" 
            : "View and download certificates earned from completed courses"}
        </p>
      </div>

      {displayItems.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-muted-foreground" />
            </div>
            <CardTitle>{isAr ? "لا توجد شهادات بعد" : "No Certificates Yet"}</CardTitle>
            <CardDescription className="max-w-sm mx-auto mt-2">
              {isAr 
                ? "أكمل الدورات للحصول على الشهادات. ستظهر شهاداتك هنا بمجرد إكمال الدورة." 
                : "Complete courses to earn certificates. Your certificates will appear here once you complete a course."}
            </CardDescription>
            <div className="mt-6">
              <Button asChild variant="outline">
                <Link href={`/${lang}/student/browse`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  {isAr ? "تصفح الدورات" : "Browse Courses"}
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <CertificatesGrid
          displayItems={displayItems}
          isAr={isAr}
          studentName={user.name || "Student"}
          highlight={highlight}
        />
      )}
    </div>
  )
}
