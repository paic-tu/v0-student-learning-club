
import { notFound } from "next/navigation"
import { CategoryForm } from "@/components/admin/category-form"
import { getCategoryById } from "@/lib/db/queries"
import { requirePermission } from "@/lib/rbac/require-permission"

export default async function EditCategoryPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params
  await requirePermission("courses:write")

  const category = await getCategoryById(id)

  if (!category) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Category</h1>
        <p className="text-muted-foreground">Update category details</p>
      </div>
      <div className="max-w-2xl">
        <CategoryForm initialData={category} lang={lang} />
      </div>
    </div>
  )
}
