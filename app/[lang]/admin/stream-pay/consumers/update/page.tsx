import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { StreamConsumersUpdate } from "@/components/admin/stream-pay/stream-consumers"

export default async function StreamPayConsumersUpdatePage(props: { params: Promise<{ lang: string }>; searchParams: Promise<{ id?: string }> }) {
  const { lang } = await props.params
  const { id } = await props.searchParams
  await requirePermission("store:write")

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title="Update Consumer"
        description="Edit or delete a Stream consumer"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: "Consumers" },
          { label: "Update" },
        ]}
      />
      <StreamConsumersUpdate lang={lang} initialId={id} />
    </div>
  )
}

