import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { requirePermission } from "@/lib/rbac/require-permission"
import { desc } from "drizzle-orm"

const createSchema = z.object({
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  descriptionEn: z.string().min(1).optional().nullable(),
  descriptionAr: z.string().min(1).optional().nullable(),
  price: z.number().min(0),
  pointsCost: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().min(0),
  categoryId: z.string().uuid(),
  streamProductId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export async function POST(req: NextRequest) {
  await requirePermission("store:write")
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 })

    const data = parsed.data
    const [created] = await db
      .insert(products)
      .values({
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        descriptionEn: data.descriptionEn || null,
        descriptionAr: data.descriptionAr || null,
        price: data.price.toFixed(2),
        pointsCost: data.pointsCost ?? null,
        stockQuantity: data.stock,
        categoryId: data.categoryId,
        streamProductId: data.streamProductId ?? null,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive,
      })
      .returning({ id: products.id })

    return NextResponse.json({ success: true, id: created?.id })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create store item" }, { status: 500 })
  }
}

export async function GET() {
  await requirePermission("store:read")
  const rows = await db.query.products.findMany({
    orderBy: [desc(products.createdAt)],
  })
  return NextResponse.json(rows)
}
