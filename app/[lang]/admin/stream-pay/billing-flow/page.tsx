import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { BillingFlowWizard } from "@/components/admin/stream-pay/billing-flow-wizard"

export default async function StreamPayBillingFlowPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  await requirePermission("store:write")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title={lang === "ar" ? "تدفق الفوترة الكامل" : "Full Billing Flow"}
        description={lang === "ar" ? "اختيار عميل → منتج → فاتورة/رابط دفع من شاشة واحدة" : "Customer → Product → Invoice/Payment Link in one screen"}
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Full Billing Flow" },
        ]}
      />
      <BillingFlowWizard lang={lang} />
    </div>
  )
}

