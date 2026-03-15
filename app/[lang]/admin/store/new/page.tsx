import { Suspense } from "react"
import { db } from "@/lib/db"
import { categories } from "@/lib/db/schema"
import { asc } from "drizzle-orm"
import { PageHeader } from "@/components/admin/page-header"
import { StoreItemForm } from "@/components/admin/store-item-form"
import { requirePermission } from "@/lib/rbac/require-permission"

async function getCategories() {
  try {
    const result = await db.query.categories.findMany({
      columns: {
        id: true,
        nameEn: true,
        nameAr: true
      },
      orderBy: [asc(categories.nameEn)]
    })
    return result
  } catch (error) {
    console.error("[v0] Error fetching categories:", error)
    return []
  }
}

export default async function NewStoreItemPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  await requirePermission("store:write")
  const categoriesData = await getCategories()

  return (
    <div>
      <PageHeader
        title="Create New Store Item"
        description="Add a new product to the store"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Store", href: `/${lang}/admin/store` },
          { label: "New" },
        ]}
      />

      <Suspense fallback={<div>Loading form...</div>}>
        <StoreItemForm lang={lang} categories={categoriesData} />
      </Suspense>
    </div>
  )
}
