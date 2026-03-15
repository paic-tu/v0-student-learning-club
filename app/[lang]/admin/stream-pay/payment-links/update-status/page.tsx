import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { StreamPaymentLinksUpdateStatus } from "@/components/admin/stream-pay/stream-payment-links"

export default async function StreamPayPaymentLinksUpdateStatusPage(props: { params: Promise<{ lang: string }>; searchParams: Promise<{ id?: string }> }) {
  const { lang } = await props.params
  const { id } = await props.searchParams
  await requirePermission("store:write")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title="Update Payment Link Status"
        description="Change Stream payment link status"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Payment Links" },
          { label: "Update Status" },
        ]}
      />
      <StreamPaymentLinksUpdateStatus lang={lang} initialId={id} />
    </div>
  )
}

