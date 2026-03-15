import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { NavBar } from "@/components/nav-bar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function StreamCheckoutFailurePage(props: {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { lang } = await props.params
  const sp = await props.searchParams

  const user = await getCurrentUser()
  if (!user) redirect(`/${lang}/auth/login?redirectTo=/${lang}/checkout/stream/failure`)

  const message = typeof sp.message === "string" ? sp.message : null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="container mx-auto px-4 py-12 flex-1">
        <Card>
          <CardHeader>
            <CardTitle>{lang === "ar" ? "فشل الدفع" : "Payment Failed"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
            <div className="text-muted-foreground">
              {lang === "ar"
                ? "لم تكتمل عملية الدفع. يمكنك المحاولة مرة أخرى من السلة."
                : "The payment did not complete. You can try again from your cart."}
            </div>
            {message && <div className="text-sm text-muted-foreground">{message}</div>}
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/${lang}/cart`}>{lang === "ar" ? "العودة للسلة" : "Back to Cart"}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/${lang}/store`}>{lang === "ar" ? "المتجر" : "Store"}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  )
}

