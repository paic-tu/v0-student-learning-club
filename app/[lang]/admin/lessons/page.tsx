import { Suspense } from "react"
import { db } from "@/lib/db"
import { lessons, courses } from "@/lib/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { PageHeader } from "@/components/admin/page-header"
import { LessonsTable } from "@/components/admin/lessons-table"
import { Plus } from "lucide-react"
import { requireAdmin } from "@/lib/rbac/require-permission"

async function getLessons() {
  try {
    const result = await db
      .select({
        id: lessons.id,
        titleEn: lessons.titleEn,
        titleAr: lessons.titleAr,
        slug: sql<string>`COALESCE(${lessons.slug}, LOWER(REGEXP_REPLACE(${lessons.titleEn}, '[^a-zA-Z0-9]+', '-', 'g')))`,
        courseId: lessons.courseId,
        courseTitleEn: courses.titleEn,
        status: sql<string>`COALESCE(${lessons.status}, CASE WHEN ${courses.isPublished} THEN 'published' ELSE 'draft' END)`,
        contentType: lessons.type,
        orderIndex: lessons.orderIndex,
        durationMinutes: lessons.durationMinutes,
        freePreview: lessons.isPreview,
        createdAt: lessons.createdAt,
        updatedAt: lessons.updatedAt,
      })
      .from(lessons)
      .leftJoin(courses, eq(lessons.courseId, courses.id))
      .orderBy(desc(sql`COALESCE(${lessons.updatedAt}, ${lessons.createdAt})`))

    return result.map(lesson => ({
      ...lesson,
      contentType: lesson.contentType || 'video',
      duration: lesson.durationMinutes || 0,
      freePreview: lesson.freePreview || false,
      updatedAt: lesson.updatedAt || lesson.createdAt
    }))
  } catch (error) {
    console.error("[v0] Error fetching lessons:", error)
    // Return empty array on error to prevent page crash
    return []
  }
}

export default async function LessonsPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params
  const { lang } = params
  await requireAdmin()
  const lessonsData = await getLessons()

  return (
    <div>
      <PageHeader
        title="Lessons"
        description="Manage all lessons across courses"
        breadcrumbs={[{ label: "Admin", href: `/${lang}/admin` }, { label: "Lessons" }]}
        action={{
          label: "New Lesson",
          href: `/${lang}/admin/lessons/new`,
          icon: <Plus className="mr-2 h-4 w-4" />,
        }}
      />

      <Suspense fallback={<div>Loading...</div>}>
        <LessonsTable data={lessonsData as any} />
      </Suspense>
    </div>
  )
}
