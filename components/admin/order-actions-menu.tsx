"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CheckCircle, XCircle, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function OrderActionsMenu({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = segments[1] || "ar"
  const isAr = locale === "ar"

  const updateOrderStatus = async (status: string, fulfill?: boolean) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, fulfill: Boolean(fulfill) }),
      })

      if (!response.ok) throw new Error("Failed to update order")

      toast({
        title: isAr ? "تم" : "Success",
        description: isAr ? "تم تحديث حالة الطلب" : "Order status updated",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل تحديث الطلب" : "Failed to update order",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus === "pending" && (
          <>
            <DropdownMenuItem onClick={() => updateOrderStatus("paid", true)}>
              <CheckCircle className={cn("h-4 w-4", isAr ? "ml-2" : "mr-2")} />
              {isAr ? "تأكيد الدفع (تفعيل الدورات)" : "Mark as Paid (fulfill)"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateOrderStatus("cancelled")}>
              <XCircle className={cn("h-4 w-4", isAr ? "ml-2" : "mr-2")} />
              {isAr ? "إلغاء الطلب" : "Cancel Order"}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem>
          <DollarSign className={cn("h-4 w-4", isAr ? "ml-2" : "mr-2")} />
          {isAr ? "استرجاع (لاحقًا)" : "Refund (soon)"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
