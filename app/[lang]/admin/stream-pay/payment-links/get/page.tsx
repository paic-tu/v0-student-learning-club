import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { StreamPaymentLinksGet } from "@/components/admin/stream-pay/stream-payment-links"

export default async function StreamPayPaymentLinksGetPage(props: { params: Promise<{ lang: string }>; searchParams: Promise<{ id?: string }> }) {
  const { lang } = await props.params
  const { id } = await props.searchParams
  await requirePermission("store:read")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title="Get Payment Link"
        description="Fetch a Stream payment link by id"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Payment Links" },
          { label: "Get" },
        ]}
      />
      <StreamPaymentLinksGet lang={lang} initialId={id} />
    </div>
  )
}

