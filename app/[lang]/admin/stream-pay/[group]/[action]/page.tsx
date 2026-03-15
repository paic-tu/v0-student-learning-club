import { notFound } from "next/navigation"
import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { getStreamPayEndpoint } from "@/lib/admin/stream-pay-endpoints"
import { StreamPayApiRunner } from "@/components/admin/stream-pay-api-runner"
import { promises as fs } from "fs"
import path from "path"

export default async function StreamPayEndpointPage(props: {
  params: Promise<{ lang: string; group: string; action: string }>
}) {
  const { lang, group, action } = await props.params
  await requirePermission("store:read")

  const endpoint = getStreamPayEndpoint(group, action)
  if (!endpoint) notFound()

  let paymentSpec = ""
  if (group === "payment-links" && action === "create") {
    try {
      paymentSpec = await fs.readFile(path.join(process.cwd(), "payment.txt"), "utf8")
    } catch {
      paymentSpec = ""
    }
  }

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title={`Stream Pay — ${endpoint.title}`}
        description={lang === "ar" ? "واجهة تكامل برمجية" : "Integration endpoint"}
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay", href: `/${lang}/admin/stream-pay` },
          { label: endpoint.title },
        ]}
      />

      <StreamPayApiRunner lang={lang} endpoint={endpoint} specText={paymentSpec || undefined} />
    </div>
  )
}
