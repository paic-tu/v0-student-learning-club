"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { Trash2, ShoppingCart, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { removeFromCartAction, checkoutAction } from "@/lib/actions"
import Link from "next/link"

interface CartItem {
  id: string
  course?: {
    id: string
    titleEn: string
    titleAr: string
    price: string
    thumbnailUrl: string | null
  } | null
  product?: {
    id: string
    nameEn: string
    nameAr: string
    price: string
    imageUrl: string | null
  } | null
  quantity: number
}

interface CartClientProps {
  initialCart: {
    id: string
    items: CartItem[]
  } | null
}

export function CartClient({ initialCart }: CartClientProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  const items = initialCart?.items || []
  
  const total = items.reduce((acc, item) => {
    const price = item.course 
      ? parseFloat(item.course.price) 
      : item.product 
        ? parseFloat(item.product.price) 
        : 0
    return acc + (price * item.quantity)
  }, 0)

  const handleRemove = (itemId: string) => {
    startTransition(async () => {
      const result = await removeFromCartAction(itemId)
      if (result.success) {
        toast({
          title: language === "ar" ? "تم الحذف" : "Removed",
          description: language === "ar" ? "تم حذف العنصر من السلة" : "Item removed from cart",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to remove item",
        })
      }
    })
  }

  const handleCheckout = () => {
    startTransition(async () => {
      const result = await checkoutAction()
      if (result.success) {
        toast({
          title: language === "ar" ? "تم الطلب بنجاح" : "Order Placed",
          description: language === "ar" ? "تم إنشاء طلبك وتفعيل الدورات" : "Your order has been placed and courses activated",
        })
        router.push(`/${language}/library`)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Checkout failed",
        })
      }
    })
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShoppingCart className="h-24 w-24 text-muted-foreground/50" />
        <h2 className="text-2xl font-bold">{language === "ar" ? "سلة المشتريات فارغة" : "Your cart is empty"}</h2>
        <p className="text-muted-foreground">
          {language === "ar" ? "أضف بعض الدورات لبدء التعلم" : "Add some courses to start learning"}
        </p>
        <Button asChild>
          <Link href={`/${language}/courses`}>
            {language === "ar" ? "تصفح الدورات" : "Browse Courses"}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{language === "ar" ? "سلة المشتريات" : "Shopping Cart"}</h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const title = item.course 
              ? (language === "ar" ? item.course.titleAr : item.course.titleEn)
              : (language === "ar" ? item.product?.nameAr : item.product?.nameEn)
            
            const price = item.course 
              ? item.course.price 
              : item.product?.price
              
            const image = item.course?.thumbnailUrl || item.product?.imageUrl

            return (
              <Card key={item.id} className="flex flex-col sm:flex-row overflow-hidden">
                <div className="w-full sm:w-48 h-32 bg-muted relative shrink-0">
                  {image ? (
                    <img src={image} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                  )}
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {item.course ? (language === "ar" ? "دورة" : "Course") : (language === "ar" ? "منتج" : "Product")}
                      </p>
                    </div>
                    <p className="font-bold text-lg">${price}</p>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                      onClick={() => handleRemove(item.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      {language === "ar" ? "حذف" : "Remove"}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "ملخص الطلب" : "Order Summary"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>{language === "ar" ? "المجموع" : "Total"}</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full gap-2" 
                size="lg" 
                onClick={handleCheckout}
                disabled={isPending}
              >
                <CreditCard className="h-4 w-4" />
                {isPending 
                  ? (language === "ar" ? "جاري المعالجة..." : "Processing...") 
                  : (language === "ar" ? "إتمام الشراء" : "Checkout")
                }
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}