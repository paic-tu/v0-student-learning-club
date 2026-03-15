import { requirePermission } from "@/lib/rbac/require-permission"
import { PageHeader } from "@/components/admin/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StreamPayTestCheckout } from "@/components/admin/stream-pay-test-checkout"
import { promises as fs } from "fs"
import path from "path"

export default async function StreamPayAdminPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params
  await requirePermission("store:read")

  const hasApi = Boolean(process.env.STREAM_API_KEY_BASE64 || (process.env.STREAM_API_KEY && process.env.STREAM_API_SECRET))
  const hasWebhookSecret = Boolean(process.env.STREAM_WEBHOOK_SECRET)
  const webhookUrl = `${(process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "")}/api/webhooks/stream`

  let paymentSpec = ""
  try {
    const filePath = path.join(process.cwd(), "payment.txt")
    paymentSpec = await fs.readFile(filePath, "utf8")
  } catch {
    paymentSpec = ""
  }

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <PageHeader
        title="Stream Pay"
        description={lang === "ar" ? "إدارة تكامل Stream للمتجر والدفع" : "Manage Stream integration for store payments"}
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Stream Pay" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang === "ar" ? "API" : "API"}</CardTitle>
            <Badge variant={hasApi ? "default" : "secondary"}>{hasApi ? "ON" : "OFF"}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {lang === "ar"
                ? "يجب ضبط STREAM_API_KEY_BASE64 أو STREAM_API_KEY + STREAM_API_SECRET"
                : "Set STREAM_API_KEY_BASE64 or STREAM_API_KEY + STREAM_API_SECRET"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang === "ar" ? "Webhook Secret" : "Webhook Secret"}</CardTitle>
            <Badge variant={hasWebhookSecret ? "default" : "secondary"}>{hasWebhookSecret ? "ON" : "OFF"}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {lang === "ar" ? "ضع STREAM_WEBHOOK_SECRET من لوحة Stream" : "Set STREAM_WEBHOOK_SECRET from Stream dashboard"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{lang === "ar" ? "Webhook URL" : "Webhook URL"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs break-all">{webhookUrl}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="test" className="w-full">
        <TabsList>
          <TabsTrigger value="test">{lang === "ar" ? "اختبار الدفع" : "Test Checkout"}</TabsTrigger>
          <TabsTrigger value="mapping">{lang === "ar" ? "ربط المنتجات" : "Product Mapping"}</TabsTrigger>
          <TabsTrigger value="spec">{lang === "ar" ? "مواصفات الدفع" : "Payment Spec"}</TabsTrigger>
        </TabsList>

        <TabsContent value="test">
          <StreamPayTestCheckout lang={lang} />
        </TabsContent>

        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>{lang === "ar" ? "ربط المنتجات مع Stream" : "Map local items to Stream products"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                {lang === "ar"
                  ? "لازم تضيف stream product_id لكل كورس مدفوع أو منتج متجر مدفوع."
                  : "Set Stream product_id for every paid course or paid store product."}
              </div>
              <div className="flex flex-wrap gap-3">
                <a className="underline" href={`/${lang}/admin/courses`}>
                  {lang === "ar" ? "الدورات" : "Courses"}
                </a>
                <a className="underline" href={`/${lang}/admin/store`}>
                  {lang === "ar" ? "المتجر" : "Store"}
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spec">
          <Card>
            <CardHeader>
              <CardTitle>{lang === "ar" ? "Create Payment Link (Spec)" : "Create Payment Link (Spec)"}</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentSpec ? (
                <pre className="max-h-[520px] overflow-auto rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">
                  {paymentSpec}
                </pre>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {lang === "ar" ? "لم يتم العثور على payment.txt" : "payment.txt was not found"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
