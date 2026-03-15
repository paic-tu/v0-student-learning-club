"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type ProductOption = {
  id: string
  nameEn?: string
  nameAr?: string
  price: string | number
  streamProductId?: string | null
}

export function StoreCourseProductLinker(props: {
  lang: string
  courseId: string
  products: ProductOption[]
}) {
  const router = useRouter()
  const isAr = props.lang === "ar"
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const productsById = useMemo(() => new Map(props.products.map((p) => [p.id, p])), [props.products])

  const link = () => {
    startTransition(async () => {
      try {
        const product = productsById.get(selectedProductId)
        if (!product) throw new Error(isAr ? "اختر منتجًا" : "Select a product")

        let streamProductId = product.streamProductId || null
        if (!streamProductId) {
          const res = await fetch("/api/admin/stream/billing-flow/ensure-product", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: product.id }),
          })
          const body = await res.json().catch(() => null)
          if (!res.ok) throw new Error(body?.error || "Failed")
          streamProductId = String(body?.streamProductId || "")
          if (!streamProductId) throw new Error("Stream product id missing")
        }

        const priceNumber = Number.parseFloat(String(product.price))
        if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
          throw new Error(isAr ? "سعر المنتج غير صالح" : "Invalid product price")
        }

        const res2 = await fetch(`/api/admin/courses/${encodeURIComponent(props.courseId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stream_product_id: streamProductId,
            price: priceNumber,
            is_free: false,
          }),
        })
        const body2 = await res2.json().catch(() => null)
        if (!res2.ok) throw new Error(body2?.error || "Failed")

        toast.success(isAr ? "تم الربط" : "Linked")
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  const unlink = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/courses/${encodeURIComponent(props.courseId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stream_product_id: null,
            price: 0,
            is_free: true,
          }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        toast.success(isAr ? "تم الإلغاء" : "Unlinked")
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <div className="grid gap-1">
        <Label className="text-xs">{isAr ? "ربط المنتج" : "Link product"}</Label>
        <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={isPending}>
          <SelectTrigger className="h-8 w-[220px]">
            <SelectValue placeholder={isAr ? "اختر منتج" : "Select product"} />
          </SelectTrigger>
          <SelectContent>
            {props.products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {isAr ? p.nameAr || p.nameEn || p.id : p.nameEn || p.nameAr || p.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button size="sm" variant="outline" onClick={link} disabled={isPending || !selectedProductId}>
        {isPending ? (isAr ? "..." : "...") : isAr ? "ربط" : "Link"}
      </Button>
      <Button size="sm" variant="ghost" onClick={unlink} disabled={isPending}>
        {isAr ? "إلغاء" : "Unlink"}
      </Button>
    </div>
  )
}

