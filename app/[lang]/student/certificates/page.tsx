
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { getUserCertificates, getStudentCourses } from "@/lib/db/queries"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CertificateDownloadButton } from "@/components/certificate/certificate-download-button"
import { CertificatePreview } from "@/components/certificate/certificate-preview"
import { Award, Calendar, Hash, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function CertificatesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
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
  const certifiedCourseIds = new Set(certificates.map((cert: any) => cert.course_id))

  // Filter completed courses that don't have certificates yet
  const completedCoursesWithoutCert = completedCourses.filter((enrollment: any) => 
    !certifiedCourseIds.has(enrollment.courseId)
  )

  // Combine them for display
  // We'll display official certificates first, then completed courses
  const displayItems = [
    ...certificates.map((cert: any) => ({
      id: cert.id,
      courseId: cert.course_id,
      titleEn: cert.course_title_en || cert.title_en,
      titleAr: cert.course_title_ar || cert.title_ar,
      instructorName: cert.instructor_name,
      issuedAt: cert.issued_at,
      certificateNumber: cert.certificate_number,
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((item: any) => (
            <Card key={item.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md">
              <div className="h-3 bg-primary/10 border-b border-primary/20" />
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <Badge variant={item.isOfficial ? "default" : "secondary"} className="w-fit mb-2">
                    {item.isOfficial 
                      ? (isAr ? "معتمدة" : "Official") 
                      : (isAr ? "مكتملة" : "Completed")}
                  </Badge>
                  <Award className={`w-5 h-5 ${item.isOfficial ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <CardTitle className="line-clamp-2 min-h-[3.5rem]">
                  {isAr ? item.titleAr : item.titleEn}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded">
                    {item.instructorName || (isAr ? "محسن الغامدي" : "Mohsen Alghamdi")}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(item.issuedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {item.certificateNumber && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="w-4 h-4" />
                    <span className="font-mono text-xs">{item.certificateNumber}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2 pb-6">
                <CertificateDownloadButton
                  studentName={user.name || "Student"}
                  courseName={isAr ? item.titleAr : item.titleEn}
                  instructorName={item.instructorName || (isAr ? "محسن الغامدي" : "Mohsen Alghamdi")}
                  completionDate={new Date(item.issuedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  courseId={item.courseId}
                  certificateNumber={item.certificateNumber}
                  className="w-full"
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <CertificatePreview 
        studentName={user.name || "Student Name"} 
        certificates={previewCertificates}
      />
    </div>
  )
}
