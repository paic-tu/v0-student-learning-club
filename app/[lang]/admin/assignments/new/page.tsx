import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { courses } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssignmentForm } from "@/components/assignments/assignment-form"

export default async function AdminAssignmentNewPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  const isAr = lang === "ar"
  await requirePermission("lessons:write")

  const courseRows = await db.query.courses.findMany({
    columns: { id: true, titleEn: true, titleAr: true },
    orderBy: [desc(courses.createdAt)],
    limit: 500,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{isAr ? "إضافة واجب" : "New Assignment"}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "معلومات الواجب" : "Assignment details"}</CardTitle>
        </CardHeader>
        <CardContent>
          <AssignmentForm lang={lang} apiUrl="/api/admin/assignments" courses={courseRows} redirectTo={`/${lang}/admin/assignments`} />
        </CardContent>
      </Card>
    </div>
  )
}

