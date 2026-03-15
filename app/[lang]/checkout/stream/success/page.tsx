import Link from "next/link"
import { redirect } from "next/navigation"
import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth"
import { NavBar } from "@/components/nav-bar"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function StreamCheckoutSuccessPage(props: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ order_id?: string }>
}) {
  const { lang } = await props.params
  const sp = await props.searchParams
  const orderId = sp.order_id

  const user = await getCurrentUser()
  if (!user) redirect(`/${lang}/auth/login?redirectTo=/${lang}/checkout/stream/success`)

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavBar />
        <main className="container mx-auto px-4 py-12 flex-1">
          <Card>
            <CardHeader>
              <CardTitle>{lang === "ar" ? "تم الدفع" : "Payment Completed"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-muted-foreground">{lang === "ar" ? "تم استلام نتيجة الدفع." : "We received the payment result."}</div>
              <Button asChild>
                <Link href={`/${lang}/store`}>{lang === "ar" ? "العودة للمتجر" : "Back to Store"}</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, user.id)),
    columns: { id: true, status: true, totalAmount: true },
  })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="container mx-auto px-4 py-12 flex-1">
        <Card>
          <CardHeader>
            <CardTitle>{lang === "ar" ? "تم الدفع بنجاح" : "Payment Successful"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
            <div className="text-muted-foreground">
              {lang === "ar"
                ? "تم استلام عملية الدفع. سيتم تفعيل مشترياتك تلقائيًا خلال لحظات."
                : "Payment received. Your purchases will be activated automatically in a moment."}
            </div>
            {order && (
              <div className="text-sm text-muted-foreground">
                {lang === "ar" ? "حالة الطلب" : "Order status"}: {order.status}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/${lang}/student/my-courses`}>{lang === "ar" ? "دوراتي" : "My Courses"}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/${lang}/orders`}>{lang === "ar" ? "طلباتي" : "My Orders"}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  )
}

