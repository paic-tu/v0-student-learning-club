import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { streamRequest } from "@/lib/payments/stream"

const schema = z.object({
  nameEn: z.string().min(1),
  nameAr: z.string().optional().or(z.literal("")),
  price: z.coerce.number().min(0.01),
})

export async function POST(req: NextRequest) {
  await requirePermission("store:write")
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })

  try {
    const nameEn = parsed.data.nameEn
    const nameAr = parsed.data.nameAr?.trim() ? parsed.data.nameAr.trim() : nameEn
    const price = parsed.data.price.toFixed(2)

    const createdStream = await streamRequest<any>("/products", {
      method: "POST",
      body: JSON.stringify({ name: nameEn, type: "ONE_OFF", currency: "SAR", price }),
    })
    const streamProductId = createdStream?.id
    if (!streamProductId) return NextResponse.json({ error: "Stream product id missing" }, { status: 500 })

    const [createdLocal] = await db
      .insert(products)
      .values({
        nameEn,
        nameAr,
        descriptionEn: null,
        descriptionAr: null,
        price,
        pointsCost: null,
        streamProductId,
        imageUrl: null,
        stockQuantity: 0,
        categoryId: null,
        isActive: true,
      })
      .returning()

    return NextResponse.json({ success: true, product: createdLocal, streamProduct: createdStream })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

