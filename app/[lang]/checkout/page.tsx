"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { t } from "@/lib/i18n"
import { getCartWithItems, clearCart } from "@/lib/db/queries"
import { createOrder } from "@/lib/db/queries"
import { CreditCard } from "lucide-react"
import { RequireAuth } from "@/components/require-auth"
import { useToast } from "@/hooks/use-toast"

export default function CheckoutPage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [shippingAddress, setShippingAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      setCartItems([])
      return
    }
    loadCart(user.id)
  }, [user?.id])

  const loadCart = async (userId: string) => {
    const cart = await getCartWithItems(userId)
    setCartItems(cart?.items ?? [])
  }

  const total = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  const handlePlaceOrder = async () => {
    if (!user) return

    setLoading(true)
    try {
      const orderItems = cartItems.map((item) => ({
        price: Number(item.price),
        quantity: item.quantity,
        type: item.type,
        courseId: item.courseId,
        productId: item.productId,
      }))

      const order = await createOrder(user.id, { totalAmount: total, items: orderItems })

      if (order) {
        await clearCart(user.id)

        toast({
          title: language === "ar" ? "تم إنشاء الطلب" : "Order created",
          description: language === "ar" ? "تم إنشاء طلبك بنجاح" : "Your order has been created successfully",
        })

        router.push(`/orders`)
      }
    } catch (error) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "فشل إنشاء الطلب" : "Failed to create order",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background">
          <NavBar />
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl font-bold mb-4">{language === "ar" ? "السلة فارغة" : "Cart is empty"}</h2>
            <Button onClick={() => router.push("/store")}>{language === "ar" ? "تصفح المتجر" : "Browse Store"}</Button>
          </div>
        </div>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">{t("checkout", language)}</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">{language === "ar" ? "عنوان الشحن" : "Shipping Address"}</Label>
                    <Textarea
                      id="address"
                      placeholder={language === "ar" ? "أدخل عنوانك الكامل" : "Enter your full address"}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">{language === "ar" ? "ملاحظات (اختياري)" : "Notes (Optional)"}</Label>
                    <Textarea
                      id="notes"
                      placeholder={language === "ar" ? "أي ملاحظات إضافية" : "Any additional notes"}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t("paymentMethod", language)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "الدفع عند الاستلام - سيتم التواصل معك لتأكيد الطلب"
                      : "Cash on delivery - We will contact you to confirm your order"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-4">{language === "ar" ? "ملخص الطلب" : "Order Summary"}</h3>
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {language === "ar" ? item.name_ar : item.name_en} x{item.quantity}
                        </span>
                        <span className="font-medium">
                          {(Number(item.price) * item.quantity).toFixed(2)} {language === "ar" ? "ر.س" : "SAR"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>{t("total", language)}</span>
                      <span className="text-primary">
                        {total.toFixed(2)} {language === "ar" ? "ر.س" : "SAR"}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={loading || !shippingAddress}
                  >
                    {loading ? "..." : t("placeOrder", language)}
                  </Button>
                  {!shippingAddress && (
                    <p className="text-xs text-muted-foreground text-center">
                      {language === "ar" ? "يرجى إدخال عنوان الشحن" : "Please enter shipping address"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  )
}
