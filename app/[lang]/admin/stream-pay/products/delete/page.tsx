import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { StreamProductsDelete } from "@/components/admin/stream-pay/stream-products"

export default async function StreamPayProductsDeletePage(props: { params: Promise<{ lang: string }>; searchParams: Promise<{ id?: string }> }) {
  const { lang } = await props.params
  const { id } = await props.searchParams
  await requirePermission("store:write")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title="Delete Product"
        description="Delete a Stream product"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Products" },
          { label: "Delete" },
        ]}
      />
      <StreamProductsDelete lang={lang} initialId={id} />
    </div>
  )
}

