import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { StreamPaymentLinksList } from "@/components/admin/stream-pay/stream-payment-links"

export default async function StreamPayPaymentLinksListPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  await requirePermission("store:read")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title="List Payment Links"
        description="Browse Stream payment links"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Payment Links" },
          { label: "List" },
        ]}
      />
      <StreamPaymentLinksList lang={lang} />
    </div>
  )
}

