import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { streamRequest } from "@/lib/payments/stream"

const schema = z.object({
  productId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  await requirePermission("store:write")
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const p = await db.query.products.findFirst({
    where: eq(products.id, parsed.data.productId),
    columns: { id: true, nameEn: true, nameAr: true, price: true, streamProductId: true, isActive: true },
  })
  if (!p) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  if (p.streamProductId) {
    return NextResponse.json({ success: true, streamProductId: p.streamProductId })
  }

  try {
    const payload = {
      name: p.nameEn || p.nameAr,
      type: "ONE_OFF",
      currency: "SAR",
      price: String(p.price),
    }
    const created = await streamRequest<any>("/products", { method: "POST", body: JSON.stringify(payload) })
    const streamProductId = created?.id
    if (!streamProductId) return NextResponse.json({ error: "Stream product id missing" }, { status: 500 })

    await db.update(products).set({ streamProductId, updatedAt: new Date() }).where(eq(products.id, p.id))
    return NextResponse.json({ success: true, streamProductId, product: created })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create product" }, { status: 500 })
  }
}

