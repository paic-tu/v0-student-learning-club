"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CheckCircle, XCircle, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export function OrderActionsMenu({ orderId, currentStatus }: { orderId: number; currentStatus: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const updateOrderStatus = async (status: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error("Failed to update order")

      toast({
        title: "Success",
        description: `Order ${status === "completed" ? "completed" : "cancelled"}`,
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
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
            <DropdownMenuItem onClick={() => updateOrderStatus("completed")}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateOrderStatus("cancelled")}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Order
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem>
          <DollarSign className="mr-2 h-4 w-4" />
          Process Refund
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
