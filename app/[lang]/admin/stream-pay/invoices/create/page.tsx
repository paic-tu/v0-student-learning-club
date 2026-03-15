import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { StreamInvoicesCreate } from "@/components/admin/stream-pay/stream-invoices"

export default async function StreamPayInvoicesCreatePage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  await requirePermission("store:write")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title={lang === "ar" ? "إنشاء فاتورة" : "Create Invoice"}
        description={lang === "ar" ? "إنشاء فاتورة لعميل وربطها بمنتج" : "Create an invoice for a customer and attach a product"}
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Invoices" },
          { label: "Create" },
        ]}
      />
      <StreamInvoicesCreate lang={lang} />
    </div>
  )
}

