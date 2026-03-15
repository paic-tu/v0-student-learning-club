import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { StreamConsumersCreate } from "@/components/admin/stream-pay/stream-consumers"

export default async function StreamPayConsumersCreatePage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  await requirePermission("store:write")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title="Create Consumer"
        description="Create a Stream consumer"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Consumers" },
          { label: "Create" },
        ]}
      />
      <StreamConsumersCreate lang={lang} />
    </div>
  )
}

