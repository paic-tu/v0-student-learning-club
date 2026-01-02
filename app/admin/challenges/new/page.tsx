import { Suspense } from "react"
import { neon } from "@neondatabase/serverless"
import { PageHeader } from "@/components/admin/page-header"
import { ChallengeForm } from "@/components/admin/challenge-form"
import { requirePermission } from "@/lib/rbac/require-permission"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

async function getCategories() {
  try {
    const result = await sql`
      SELECT id, name_en as "nameEn", name_ar as "nameAr"
      FROM categories
      ORDER BY name_en ASC
    `
    return result
  } catch (error) {
    console.error("[v0] Error fetching categories:", error)
    return []
  }
}

export default async function NewChallengePage() {
  await requirePermission("challenges:write")
  const categories = await getCategories()

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
        <ChallengeForm categories={categories as any} />
      </Suspense>
    </div>
  )
}
