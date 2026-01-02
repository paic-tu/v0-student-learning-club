"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { t } from "@/lib/i18n"
import { getAllStoreItems } from "@/lib/db/queries"
import { ShoppingCart, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { addToCart } from "@/lib/db/cart-queries"

export default function StorePage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await getAllStoreItems()
        setItems(data)
      } catch (error) {
        console.error("[v0] Error loading store items:", error)
      } finally {
        setLoading(false)
      }
    }

    loadItems()
  }, [])

  const handleAddToCart = async (itemId: number) => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    try {
      await addToCart(itemId, 1)

      toast({
        title: language === "ar" ? "تمت الإضافة" : "Added to cart",
        description: language === "ar" ? "تم إضافة المنتج للسلة" : "Product added to cart",
      })
    } catch (error) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "فشل إضافة المنتج" : "Failed to add product",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("store", language)}</h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "احصل على منتجات نيون التعليمية" : "Get Neon educational products"}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{language === "ar" ? "لا توجد منتجات" : "No products"}</h3>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="flex flex-col transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="relative h-48 w-full bg-muted rounded-lg overflow-hidden mb-4">
                    <Image
                      src={item.image_url || "/placeholder.svg?height=200&width=300&query=product"}
                      alt={language === "ar" ? item.name_ar : item.name_en}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary">
                      {language === "ar" ? item.category_name_ar || "عام" : item.category_name_en || "General"}
                    </Badge>
                    <div className="text-2xl font-bold text-primary">
                      {item.price} {language === "ar" ? "ر.س" : "SAR"}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{language === "ar" ? item.name_ar : item.name_en}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? item.description_ar : item.description_en}
                  </p>
                  {item.points_cost && (
                    <p className="mt-2 text-sm font-semibold text-primary">
                      {language === "ar" ? "أو" : "Or"} {item.points_cost} {t("points", language)}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {language === "ar" ? "المخزون:" : "Stock:"} {item.stock}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleAddToCart(item.id)} disabled={item.stock === 0}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {item.stock === 0 ? (language === "ar" ? "نفذ المخزون" : "Out of stock") : t("addToCart", language)}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
