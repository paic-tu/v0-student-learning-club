import { requirePermission } from "@/lib/rbac/require-permission"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getSiteSettings } from "@/lib/db/queries"
import { Button } from "@/components/ui/button"

export default async function SettingsPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params
  const { lang } = params
  const isAr = lang === "ar"
  await requirePermission("settings:read")
  const settings = await getSiteSettings()

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold">{isAr ? "إعدادات النظام" : "System Settings"}</h1>
        <p className="text-muted-foreground">
          {isAr ? "إدارة إعدادات المنصة والتكاملات" : "Configure platform settings and integrations"}
        </p>
      </div>

      <form className="space-y-6" action={async (formData: FormData) => {
        "use server"
        await requirePermission("settings:write")
        const payload = {
          siteName: String(formData.get("siteName") || ""),
          supportEmail: String(formData.get("supportEmail") || ""),
          maintenanceMode: formData.get("maintenanceMode") === "on",
          allowRegistration: formData.get("allowRegistration") === "on",
          currency: String(formData.get("currency") || "SAR"),
          email: {
            smtpHost: String(formData.get("smtpHost") || ""),
            smtpPort: Number(formData.get("smtpPort") || 0) || undefined,
            notifications: formData.get("emailNotifications") === "on",
          },
          features: {
            showStore: formData.get("showStore") === "on",
            showMentors: formData.get("showMentors") === "on",
            enableLive: formData.get("enableLive") === "on",
          }
        }
        await fetch("/api/admin/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })
      }}>
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "الإعدادات العامة" : "General Settings"}</CardTitle>
          <CardDescription>{isAr ? "إعدادات أساسية للمنصة" : "Basic platform configuration"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site_name">{isAr ? "اسم الموقع" : "Site Name"}</Label>
            <Input name="siteName" id="site_name" defaultValue={settings.siteName} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support_email">{isAr ? "بريد الدعم" : "Support Email"}</Label>
            <Input name="supportEmail" id="support_email" type="email" defaultValue={settings.supportEmail} />
          </div>

          <div className="flex items-center gap-2">
            <Switch name="maintenanceMode" id="maintenance_mode" defaultChecked={!!settings.maintenanceMode} />
            <Label htmlFor="maintenance_mode">{isAr ? "وضع الصيانة" : "Maintenance Mode"}</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch name="allowRegistration" id="allow_registration" defaultChecked={!!settings.allowRegistration} />
            <Label htmlFor="allow_registration">{isAr ? "السماح بالتسجيل الجديد" : "Allow New Registrations"}</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "إعدادات البريد" : "Email Settings"}</CardTitle>
          <CardDescription>{isAr ? "إعداد إشعارات البريد" : "Configure email notifications"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smtp_host">SMTP Host</Label>
            <Input name="smtpHost" id="smtp_host" placeholder="smtp.example.com" defaultValue={settings.email?.smtpHost || ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp_port">SMTP Port</Label>
            <Input name="smtpPort" id="smtp_port" type="number" placeholder="587" defaultValue={settings.email?.smtpPort || ""} />
          </div>

          <div className="flex items-center gap-2">
            <Switch name="emailNotifications" id="email_notifications" defaultChecked={!!settings.email?.notifications} />
            <Label htmlFor="email_notifications">{isAr ? "تفعيل إشعارات البريد" : "Enable Email Notifications"}</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "إعدادات الدفع" : "Payment Settings"}</CardTitle>
          <CardDescription>{isAr ? "إعدادات العملة والمتجر" : "Configure payment processing"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">{isAr ? "العملة" : "Currency"}</Label>
            <Input name="currency" id="currency" defaultValue={settings.currency || "SAR"} />
          </div>

          <div className="flex items-center gap-2">
            <Switch name="showStore" id="payment_enabled" defaultChecked={!!settings.features?.showStore} />
            <Label htmlFor="payment_enabled">{isAr ? "تفعيل المتجر" : "Enable Payments"}</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "ميزات الموقع" : "Site Features"}</CardTitle>
          <CardDescription>{isAr ? "تفعيل/إيقاف الوحدات الاختيارية" : "Toggle optional modules"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch name="showMentors" id="feature_mentors" defaultChecked={!!settings.features?.showMentors} />
            <Label htmlFor="feature_mentors">{isAr ? "إظهار صفحة المرشدين" : "Show Mentors Page"}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch name="enableLive" id="feature_live" defaultChecked={!!settings.features?.enableLive} />
            <Label htmlFor="feature_live">{isAr ? "تفعيل الاستشارات المباشرة" : "Enable Live Consultations"}</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit">{isAr ? "حفظ التغييرات" : "Save Changes"}</Button>
        <Button type="reset" variant="outline">{isAr ? "إعادة ضبط" : "Reset"}</Button>
      </div>
      </form>
    </div>
  )
}
