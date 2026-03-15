import { requirePermission } from "@/lib/rbac/require-permission"
import { StreamProductsGet } from "@/components/admin/stream-pay/stream-products"
import { PageHeader } from "@/components/admin/page-header"

export default async function StreamPayProductsGetPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  await requirePermission("store:read")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title="Get Product"
        description="Fetch a Stream product by id"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Products" },
          { label: "Get" },
        ]}
      />
      <StreamProductsGet lang={lang} />
    </div>
  )
}

