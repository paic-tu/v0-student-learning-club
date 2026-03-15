import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { StreamConsumersGet } from "@/components/admin/stream-pay/stream-consumers"

export default async function StreamPayConsumersGetPage(props: { params: Promise<{ lang: string }>; searchParams: Promise<{ id?: string }> }) {
  const { lang } = await props.params
  const { id } = await props.searchParams
  await requirePermission("store:read")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title="Get Consumer"
        description="Fetch a Stream consumer by id"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Consumers" },
          { label: "Get" },
        ]}
      />
      <StreamConsumersGet lang={lang} initialId={id} />
    </div>
  )
}

