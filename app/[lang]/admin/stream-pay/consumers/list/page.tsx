import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { StreamConsumersList } from "@/components/admin/stream-pay/stream-consumers"

export default async function StreamPayConsumersListPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  await requirePermission("store:read")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title="Get All Consumers"
        description="Browse Stream consumers"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Consumers" },
          { label: "List" },
        ]}
      />
      <StreamConsumersList lang={lang} />
    </div>
  )
}

