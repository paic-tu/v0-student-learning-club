import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { StreamPaymentLinksCreate } from "@/components/admin/stream-pay/stream-payment-links"
import { getAppBaseUrl } from "@/lib/payments/stream"

export default async function StreamPayPaymentLinksCreatePage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  await requirePermission("store:write")

  const baseUrl = getAppBaseUrl()
  const defaultSuccessUrl = `${baseUrl}/${lang}/checkout/stream/success`
  const defaultFailureUrl = `${baseUrl}/${lang}/checkout/stream/failure`

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title="Create Payment Link"
        description="Create a Stream payment link"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Payment Links" },
          { label: "Create" },
        ]}
      />
      <StreamPaymentLinksCreate lang={lang} defaultSuccessUrl={defaultSuccessUrl} defaultFailureUrl={defaultFailureUrl} />
    </div>
  )
}

