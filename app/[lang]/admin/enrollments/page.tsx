import { Suspense } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { requirePermission } from "@/lib/rbac/require-permission"
import { EnrollmentsTable } from "@/components/admin/enrollments-table"
import { Card, CardContent } from "@/components/ui/card"
import { db } from "@/lib/db"
import { enrollments, users, courses } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

async function getEnrollments() {
  try {
    const data = await db
      .select({
        id: enrollments.id,
        userId: enrollments.userId,
        courseId: enrollments.courseId,
        progress: enrollments.progress,
        completedAt: enrollments.completedAt,
        createdAt: enrollments.createdAt,
        updatedAt: enrollments.updatedAt,
        user_name: users.name,
        user_email: users.email,
        course_title_en: courses.titleEn,
        course_title_ar: courses.titleAr,
      })
      .from(enrollments)
      .leftJoin(users, eq(enrollments.userId, users.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .orderBy(desc(enrollments.createdAt))
      .limit(100)
    
    return data
  } catch (error) {
    console.error("[v0] Error fetching enrollments:", error)
    return []
  }
}

export default async function EnrollmentsPage() {
  await requirePermission("enrollments:read")
  const enrollments = await getEnrollments()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        description="Manage course enrollments and progress"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Enrollments" }]}
      />

      <Card>
        <CardContent className="p-0">
            <Suspense fallback={<div className="p-8 text-center">Loading enrollments...</div>}>
                <EnrollmentsTable enrollments={enrollments} />
            </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
