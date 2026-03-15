import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { StreamInvoicesGet } from "@/components/admin/stream-pay/stream-invoices"

export default async function StreamPayInvoicesGetPage(props: { params: Promise<{ lang: string }>; searchParams: Promise<{ id?: string }> }) {
  const { lang } = await props.params
  const { id } = await props.searchParams
  await requirePermission("store:read")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title={lang === "ar" ? "جلب فاتورة" : "Get Invoice"}
        description={lang === "ar" ? "جلب فاتورة بواسطة رقمها" : "Fetch an invoice by id"}
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Invoices" },
          { label: "Get" },
        ]}
      />
      <StreamInvoicesGet lang={lang} initialId={id} />
    </div>
  )
}

