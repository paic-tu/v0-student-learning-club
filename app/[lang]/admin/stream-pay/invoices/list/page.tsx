import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { StreamInvoicesList } from "@/components/admin/stream-pay/stream-invoices"

export default async function StreamPayInvoicesListPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  await requirePermission("store:read")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title={lang === "ar" ? "قائمة الفواتير" : "List Invoices"}
        description={lang === "ar" ? "عرض فواتير Stream" : "Browse Stream invoices"}
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Invoices" },
          { label: "List" },
        ]}
      />
      <StreamInvoicesList lang={lang} />
    </div>
  )
}

