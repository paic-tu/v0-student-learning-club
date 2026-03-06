
import { CategoryForm } from "@/components/admin/category-form"
import { requirePermission } from "@/lib/rbac/require-permission"

export default async function NewCategoryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  await requirePermission("courses:write")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Category</h1>
        <p className="text-muted-foreground">Create a new course category</p>
      </div>
      <div className="max-w-2xl">
        <CategoryForm lang={lang} />
      </div>
    </div>
  )
}
