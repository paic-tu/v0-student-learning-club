import { requirePermission } from "@/lib/rbac/require-permission"
import { StreamProductsCreate } from "@/components/admin/stream-pay/stream-products"
import { PageHeader } from "@/components/admin/page-header"

export default async function StreamPayProductsCreatePage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  await requirePermission("store:write")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title="Create Product"
        description="Create a Stream product"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Products" },
          { label: "Create" },
        ]}
      />
      <StreamProductsCreate lang={lang} />
    </div>
  )
}

