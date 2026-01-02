"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { getCartWithItems, removeFromCart, updateCartQuantity } from "@/lib/db/cart-queries"
import { ShoppingCart, X, Plus, Minus } from "lucide-react"
import { RequireAuth } from "@/components/require-auth"
import Image from "next/image"

export default function CartPage() {
  const { language } = useLanguage()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const items = await getCartWithItems()
      setCartItems(items)
    } catch (error) {
      console.error("[v0] Error loading cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (itemId: number) => {
    await removeFromCart(itemId)
    setCartItems(cartItems.filter((item) => item.id !== itemId))
  }

  const handleUpdateQuantity = async (itemId: number, change: number) => {
    const item = cartItems.find((i) => i.id === itemId)
    if (!item) return

    const newQuantity = Math.max(1, item.quantity + change)
    await updateCartQuantity(itemId, newQuantity)

    setCartItems(cartItems.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i)))
  }

  const total = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

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
          <h1 className="text-3xl font-bold mb-8">{t("cart", language)}</h1>

          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t("emptyCart", language)}</h3>
              <p className="text-muted-foreground mb-6">
                {language === "ar" ? "تصفح المتجر وأضف منتجات" : "Browse the store and add products"}
              </p>
              <Link href="/store">
                <Button>{language === "ar" ? "تصفح المتجر" : "Browse Store"}</Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="relative h-24 w-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image_url || "/placeholder.svg?height=100&width=100&query=product"}
                            alt={language === "ar" ? item.name_ar : item.name_en}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg">{language === "ar" ? item.name_ar : item.name_en}</h3>
                            <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)}>
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {language === "ar" ? item.description_ar : item.description_en}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-transparent"
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 bg-transparent"
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                disabled={item.quantity >= item.stock}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <span className="text-lg font-semibold text-primary">
                              {Number(item.price) * item.quantity} {language === "ar" ? "ر.س" : "SAR"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t("subtotal", language)}</span>
                        <span>
                          {total.toFixed(2)} {language === "ar" ? "ر.س" : "SAR"}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>{t("total", language)}</span>
                        <span className="text-primary">
                          {total.toFixed(2)} {language === "ar" ? "ر.س" : "SAR"}
                        </span>
                      </div>
                    </div>
                    <Button className="w-full" size="lg" onClick={() => router.push("/checkout")}>
                      {t("proceedToCheckout", language)}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  )
}
