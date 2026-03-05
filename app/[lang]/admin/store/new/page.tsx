import { Suspense } from "react"
import { neon } from "@neondatabase/serverless"
import { PageHeader } from "@/components/admin/page-header"
import { StoreItemForm } from "@/components/admin/store-item-form"
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

export default async function NewStoreItemPage() {
  await requirePermission("store:write")
  const categories = await getCategories()

  return (
    <div>
      <PageHeader
        title="Create New Store Item"
        description="Add a new product to the store"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Store", href: "/admin/store" }, { label: "New" }]}
      />

      <Suspense fallback={<div>Loading form...</div>}>
        <StoreItemForm categories={categories as any} />
      </Suspense>
    </div>
  )
}
