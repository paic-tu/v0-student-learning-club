import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SettingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Instructor Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Manage payout and notification settings.</p>
        </CardContent>
      </Card>
    </div>
  )
}
