import { Suspense } from "react"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { categories, products } from "@/lib/db/schema"
import { asc, eq } from "drizzle-orm"
import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { StoreItemForm } from "@/components/admin/store-item-form"

async function getCategories() {
  try {
    return await db.query.categories.findMany({
      columns: { id: true, nameEn: true, nameAr: true },
      orderBy: [asc(categories.nameEn)],
    })
  } catch {
    return []
  }
}

export default async function EditStoreItemPage(props: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await props.params
  await requirePermission("store:write")

  const [product, categoriesData] = await Promise.all([
    db.query.products.findFirst({ where: eq(products.id, id) }),
    getCategories(),
  ])

  if (!product) notFound()

  return (
    <div>
      <PageHeader
        title="Edit Store Item"
        description={`Edit ${product.nameEn}`}
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Store", href: `/${lang}/admin/store` },
          { label: product.nameEn },
        ]}
      />

      <Suspense fallback={<div>Loading form...</div>}>
        <StoreItemForm lang={lang} categories={categoriesData as any} product={product as any} />
      </Suspense>
    </div>
  )
}

