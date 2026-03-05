import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function VerifyEmailPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return (
    <div className="container flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Email</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please check your email for the verification link.</p>
        </CardContent>
      </Card>
    </div>
  )
}
