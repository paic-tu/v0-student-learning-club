import { db } from "@/lib/db"
import { ibmSubmissions } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { IBMSubmissionsClient } from "@/components/admin/ibm-submissions-client"

export default async function IBMSubmissionsAdminPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const isAr = lang === "ar"

  const submissions = await db.query.ibmSubmissions.findMany({
    orderBy: [desc(ibmSubmissions.createdAt)],
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{isAr ? "طلبات IBM" : "IBM Submissions"}</h1>
          <p className="text-muted-foreground">
            {isAr ? "عرض ومراجعة طلبات المشاركة في كورسات IBM" : "View and review IBM course participation requests"}
          </p>
        </div>
      </div>

      <IBMSubmissionsClient initialSubmissions={submissions} lang={lang} />
    </div>
  )
}
