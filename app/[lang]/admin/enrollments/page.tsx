import { Suspense } from "react"
import { neon } from "@neondatabase/serverless"
import { PageHeader } from "@/components/admin/page-header"
import { requirePermission } from "@/lib/rbac/require-permission"
import { EnrollmentsTable } from "@/components/admin/enrollments-table"
import { Card, CardContent } from "@/components/ui/card"

const sql = neon(process.env.DATABASE_URL!)

async function getEnrollments() {
  try {
    const enrollments = await sql`
      SELECT 
        e.*,
        u.name as user_name,
        u.email as user_email,
        c.title_en as course_title_en,
        c.title_ar as course_title_ar
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN courses c ON e.course_id = c.id
      ORDER BY e.created_at DESC
      LIMIT 100
    `
    return enrollments
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
