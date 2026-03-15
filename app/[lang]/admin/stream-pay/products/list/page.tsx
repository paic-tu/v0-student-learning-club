import { requirePermission } from "@/lib/rbac/require-permission"
import { StreamProductsList } from "@/components/admin/stream-pay/stream-products"
import { PageHeader } from "@/components/admin/page-header"

export default async function StreamPayProductsListPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  await requirePermission("store:read")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title="List Products"
        description="Browse Stream products"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Products" },
          { label: "List" },
        ]}
      />
      <StreamProductsList lang={lang} />
    </div>
  )
}

