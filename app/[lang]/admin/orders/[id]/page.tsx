import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OrderActionsMenu } from "@/components/admin/order-actions-menu"

function money(v: any) {
  const n = Number(v)
  if (!Number.isFinite(n)) return "0.00"
  return n.toFixed(2)
}

export default async function AdminOrderDetailsPage(props: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await props.params
  const isAr = lang === "ar"
  await requirePermission("orders:read")

  const order = await db.query.orders.findFirst({
    where: (t, { eq }) => eq(t.id, id),
    with: {
      user: { columns: { id: true, name: true, email: true } },
      items: {
        with: {
          course: { columns: { id: true, titleAr: true, titleEn: true } },
          product: { columns: { id: true, nameAr: true, nameEn: true } },
        },
      },
    },
  })

  if (!order) notFound()

  const items = Array.isArray(order.items) ? order.items : []
  const itemsTotal = items.reduce((acc, it: any) => acc + Number(it.price || 0) * Number(it.quantity || 1), 0)
  const couponIds = Array.isArray(order.couponIds) ? order.couponIds : order.couponIds ? [order.couponIds] : []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{isAr ? "تفاصيل الطلب" : "Order Details"}</h1>
          <div className="text-muted-foreground">
            {isAr ? "رقم الطلب:" : "Order ID:"} {order.id}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${lang}/admin/orders`}>{isAr ? "رجوع" : "Back"}</Link>
          </Button>
          <OrderActionsMenu orderId={order.id} currentStatus={order.status || "pending"} />
          {order.paymentLinkUrl ? (
            <Button asChild>
              <a href={order.paymentLinkUrl} target="_blank" rel="noreferrer">
                {isAr ? "فتح الدفع" : "Open Payment"}
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "ملخص" : "Summary"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{isAr ? "الحالة" : "Status"}</span>
              <Badge
                variant={
                  order.status === "paid" || order.status === "delivered"
                    ? "default"
                    : order.status === "cancelled"
                      ? "destructive"
                      : "secondary"
                }
              >
                {order.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{isAr ? "المجموع قبل الخصم" : "Original"}</span>
              <span>{money(order.originalAmount ?? order.totalAmount)} SAR</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{isAr ? "الخصم" : "Discount"}</span>
              <span>{money(order.discountAmount ?? 0)} SAR</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{isAr ? "الإجمالي" : "Total"}</span>
              <span className="font-semibold">{money(order.totalAmount)} SAR</span>
            </div>
            {couponIds.length > 0 ? (
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">{isAr ? "الكوبونات" : "Coupons"}</span>
                <div className="text-end break-all">{couponIds.join(", ")}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "العميل والدفع" : "Customer & Payment"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground">{isAr ? "العميل" : "Customer"}</span>
              <div className="text-end">
                <div className="font-medium">{order.user?.name || "-"}</div>
                <div className="text-muted-foreground">{order.user?.email || "-"}</div>
                {order.user?.id ? (
                  <div className="mt-1">
                    <Link className="underline" href={`/${lang}/admin/users/${order.user.id}`}>
                      {isAr ? "عرض المستخدم" : "View user"}
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{isAr ? "مزود الدفع" : "Provider"}</span>
              <span>{order.paymentProvider || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{isAr ? "حالة البوابة" : "Gateway status"}</span>
              <span className="break-all">{order.gatewayStatus || "-"}</span>
            </div>
            {order.paidAt ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{isAr ? "تاريخ الدفع" : "Paid at"}</span>
                <span>{new Date(order.paidAt).toLocaleString()}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "العناصر" : "Items"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead>{isAr ? "العنصر" : "Item"}</TableHead>
                <TableHead>{isAr ? "الكمية" : "Qty"}</TableHead>
                <TableHead>{isAr ? "السعر" : "Price"}</TableHead>
                <TableHead>{isAr ? "الإجمالي" : "Subtotal"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it: any) => {
                const title =
                  it.course ? (isAr ? it.course.titleAr : it.course.titleEn) : it.product ? (isAr ? it.product.nameAr : it.product.nameEn) : "-"
                const kind = it.course ? (isAr ? "دورة" : "Course") : it.product ? (isAr ? "منتج" : "Product") : "-"
                const qty = Number(it.quantity || 1)
                const price = Number(it.price || 0)
                return (
                  <TableRow key={it.id}>
                    <TableCell>{kind}</TableCell>
                    <TableCell className="font-medium">{title}</TableCell>
                    <TableCell>{qty}</TableCell>
                    <TableCell>{money(price)} SAR</TableCell>
                    <TableCell>{money(price * qty)} SAR</TableCell>
                  </TableRow>
                )
              })}
              <TableRow>
                <TableCell colSpan={4} className="text-end font-medium">
                  {isAr ? "مجموع العناصر" : "Items total"}
                </TableCell>
                <TableCell className="font-semibold">{money(itemsTotal)} SAR</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
