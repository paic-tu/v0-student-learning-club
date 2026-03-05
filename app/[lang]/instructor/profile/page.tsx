import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ProfilePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Instructor Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Public Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Manage your public instructor profile.</p>
        </CardContent>
      </Card>
    </div>
  )
}
