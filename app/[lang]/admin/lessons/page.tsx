import { Suspense } from "react"
import { neon } from "@neondatabase/serverless"
import { PageHeader } from "@/components/admin/page-header"
import { LessonsTable } from "@/components/admin/lessons-table"
import { Plus } from "lucide-react"
import { requireAdmin } from "@/lib/rbac/require-permission"

const sql = neon(process.env.DATABASE_URL!)

async function getLessons() {
  try {
    const result = await sql`
      SELECT 
        l.id,
        l.title_en as "titleEn",
        l.title_ar as "titleAr",
        COALESCE(l.slug, LOWER(REGEXP_REPLACE(l.title_en, '[^a-zA-Z0-9]+', '-', 'g'))) as slug,
        l.course_id as "courseId",
        c.title_en as "courseTitleEn",
        COALESCE(l.status, CASE WHEN c.is_published THEN 'published' ELSE 'draft' END) as status,
        COALESCE(l.type, 'video') as "contentType",
        l.order_index as "orderIndex",
        COALESCE(l.duration_minutes, 0) as duration,
        COALESCE(l.is_preview, false) as "freePreview",
        COALESCE(l.updated_at, l.created_at) as "updatedAt"
      FROM lessons l
      LEFT JOIN courses c ON l.course_id = c.id
      ORDER BY COALESCE(l.updated_at, l.created_at) DESC
    `
    return result
  } catch (error) {
    console.error("[v0] Error fetching lessons:", error)
    // Return empty array on error to prevent page crash
    return []
  }
}

export default async function LessonsPage() {
  await requireAdmin()
  const lessonsData = await getLessons()

  return (
    <div>
      <PageHeader
        title="Lessons"
        description="Manage all lessons across courses"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Lessons" }]}
        action={{
          label: "New Lesson",
          href: "/admin/lessons/new",
          icon: <Plus className="mr-2 h-4 w-4" />,
        }}
      />

      <Suspense fallback={<div>Loading...</div>}>
        <LessonsTable data={lessonsData as any} />
      </Suspense>
    </div>
  )
}
