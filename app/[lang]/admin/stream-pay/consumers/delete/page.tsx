import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { StreamConsumersDelete } from "@/components/admin/stream-pay/stream-consumers"

export default async function StreamPayConsumersDeletePage(props: { params: Promise<{ lang: string }>; searchParams: Promise<{ id?: string }> }) {
  const { lang } = await props.params
  const { id } = await props.searchParams
  await requirePermission("store:write")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title="Delete Consumer"
        description="Delete a Stream consumer"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Consumers" },
          { label: "Delete" },
        ]}
      />
      <StreamConsumersDelete lang={lang} initialId={id} />
    </div>
  )
}

