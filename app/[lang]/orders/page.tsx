"use client"

import { useState, useEffect } from "react"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { t } from "@/lib/i18n"
import { getUserOrders } from "@/lib/db/queries"
import { Package, ShoppingBag } from "lucide-react"
import { RequireAuth } from "@/components/require-auth"

export default function OrdersPage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return

      try {
        const data = await getUserOrders(user.id)
        setOrders(data)
      } catch (error) {
        console.error("[v0] Error loading orders:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadOrders()
    }
  }, [user])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "outline",
      completed: "default",
      cancelled: "destructive",
    }
    return variants[status] || "secondary"
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, { ar: string; en: string }> = {
      pending: { ar: "قيد المعالجة", en: "Pending" },
      completed: { ar: "مكتمل", en: "Completed" },
      cancelled: { ar: "ملغى", en: "Cancelled" },
    }
    return language === "ar" ? texts[status]?.ar || status : texts[status]?.en || status
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background">
          <NavBar />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-16">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          </main>
        </div>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">{t("orders", language)}</h1>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">{language === "ar" ? "لا توجد طلبات" : "No orders"}</h3>
              <p className="text-muted-foreground">
                {language === "ar" ? "لم تقم بأي طلبات بعد" : "You haven't placed any orders yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">
                            {language === "ar" ? "طلب رقم" : "Order"} #{order.id}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusBadge(order.status)}>{getStatusText(order.status)}</Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      {JSON.parse(order.items).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.name} x{item.quantity}
                          </span>
                          <span className="font-medium">
                            {(item.price * item.quantity).toFixed(2)} {language === "ar" ? "ر.س" : "SAR"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-semibold">{t("total", language)}</span>
                      <span className="text-lg font-bold text-primary">
                        {Number(order.total_amount).toFixed(2)} {language === "ar" ? "ر.س" : "SAR"}
                      </span>
                    </div>

                    {order.shipping_address && (
                      <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                        <p className="font-medium mb-1">{language === "ar" ? "عنوان الشحن:" : "Shipping Address:"}</p>
                        <p>{order.shipping_address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  )
}
