import { Suspense } from "react"
import { db } from "@/lib/db"
import { categories } from "@/lib/db/schema"
import { asc } from "drizzle-orm"
import { PageHeader } from "@/components/admin/page-header"
import { ChallengeForm } from "@/components/admin/challenge-form"
import { requirePermission } from "@/lib/rbac/require-permission"

async function getCategories() {
  try {
    const result = await db.query.categories.findMany({
      columns: {
        id: true,
        nameEn: true,
        nameAr: true,
      },
      orderBy: [asc(categories.nameEn)],
    })
    return result
  } catch (error) {
    console.error("[v0] Error fetching categories:", error)
    return []
  }
}

export default async function NewChallengePage() {
  await requirePermission("challenges:write")
  const categoriesData = await getCategories()

  return (
    <div>
      <PageHeader
        title="Create New Challenge"
        description="Add a new coding challenge"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Challenges", href: "/admin/challenges" },
          { label: "New" },
        ]}
      />

      <Suspense fallback={<div>Loading form...</div>}>
        <ChallengeForm categories={categoriesData as any} />
      </Suspense>
    </div>
  )
}
