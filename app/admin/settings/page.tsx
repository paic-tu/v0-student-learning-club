import { requirePermission } from "@/lib/rbac/require-permission"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default async function SettingsPage() {
  await requirePermission("settings:read")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Configure platform settings and integrations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Basic platform configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site_name">Site Name</Label>
            <Input id="site_name" defaultValue="Neon Educational Platform" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support_email">Support Email</Label>
            <Input id="support_email" type="email" defaultValue="support@neon.edu" />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="maintenance_mode" />
            <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="allow_registration" defaultChecked />
            <Label htmlFor="allow_registration">Allow New Registrations</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
          <CardDescription>Configure email notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smtp_host">SMTP Host</Label>
            <Input id="smtp_host" placeholder="smtp.example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp_port">SMTP Port</Label>
            <Input id="smtp_port" type="number" placeholder="587" />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="email_notifications" defaultChecked />
            <Label htmlFor="email_notifications">Enable Email Notifications</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>Configure payment processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" defaultValue="USD" />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="payment_enabled" defaultChecked />
            <Label htmlFor="payment_enabled">Enable Payments</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button>Save Changes</Button>
        <Button variant="outline">Reset to Defaults</Button>
      </div>
    </div>
  )
}
