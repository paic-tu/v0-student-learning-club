import { Suspense } from "react"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { categories, challenges } from "@/lib/db/schema"
import { asc, eq } from "drizzle-orm"
import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { AdminChallengeEditForm } from "@/components/admin/challenge-edit-form"

async function getCategories() {
  try {
    return await db.query.categories.findMany({
      columns: {
        id: true,
        nameEn: true,
        nameAr: true,
      },
      orderBy: [asc(categories.nameEn)],
    })
  } catch {
    return []
  }
}

export default async function AdminChallengeEditPage(props: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await props.params
  await requirePermission("challenges:write")

  const [challenge, categoriesData] = await Promise.all([
    db.query.challenges.findFirst({ where: eq(challenges.id, id) }),
    getCategories(),
  ])

  if (!challenge) notFound()

  return (
    <div>
      <PageHeader
        title="Edit Challenge"
        description={`Edit ${challenge.titleEn}`}
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Challenges", href: `/${lang}/admin/challenges` },
          { label: challenge.titleEn },
        ]}
      />

      <Suspense fallback={<div>Loading form...</div>}>
        <AdminChallengeEditForm lang={lang} categories={categoriesData as any} challenge={challenge as any} />
      </Suspense>
    </div>
  )
}

