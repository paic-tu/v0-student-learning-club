import { Suspense } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { requirePermission } from "@/lib/rbac/require-permission"
import { EnrollmentsTable } from "@/components/admin/enrollments-table"
import { EnrollmentsFilters } from "@/components/admin/enrollments-filters"
import { Card, CardContent } from "@/components/ui/card"
import { db } from "@/lib/db"
import { enrollments, users, courses } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

async function getEnrollments(courseId?: string | null) {
  try {
    const q = db
      .select({
        id: enrollments.id,
        userId: enrollments.userId,
        courseId: enrollments.courseId,
        status: enrollments.status,
        progress: enrollments.progress,
        completedAt: enrollments.completedAt,
        createdAt: enrollments.createdAt,
        updatedAt: enrollments.updatedAt,
        user_name: users.name,
        user_email: users.email,
        user_phone_number: users.phoneNumber,
        user_phone: users.phone,
        course_title_en: courses.titleEn,
        course_title_ar: courses.titleAr,
      })
      .from(enrollments)
      .leftJoin(users, eq(enrollments.userId, users.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .orderBy(desc(enrollments.createdAt))
      .limit(200)

    const data = courseId ? await q.where(eq(enrollments.courseId, courseId)) : await q
    
    return data
  } catch (error) {
    console.error("[v0] Error fetching enrollments:", error)
    return []
  }
}

async function getCourses() {
  try {
    return await db
      .select({ id: courses.id, titleEn: courses.titleEn, titleAr: courses.titleAr })
      .from(courses)
      .orderBy(desc(courses.createdAt))
      .limit(500)
  } catch {
    return []
  }
}

export default async function EnrollmentsPage(props: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ courseId?: string }>
}) {
  const { lang } = await props.params
  const sp = await props.searchParams
  const courseId = sp.courseId ? String(sp.courseId) : null
  const isAr = lang === "ar"
  await requirePermission("enrollments:read")
  const [enrollments, courseList] = await Promise.all([getEnrollments(courseId), getCourses()])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        description="Manage course enrollments and progress"
        breadcrumbs={[{ label: "Admin", href: `/${lang}/admin` }, { label: isAr ? "التسجيلات" : "Enrollments" }]}
      />

      <Card>
        <CardContent className="p-4 space-y-4">
            <EnrollmentsFilters lang={lang} courses={courseList as any} selectedCourseId={courseId} />
            <Suspense fallback={<div className="p-8 text-center">Loading enrollments...</div>}>
                <EnrollmentsTable enrollments={enrollments} />
            </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
