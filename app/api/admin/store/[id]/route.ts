import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { requirePermission } from "@/lib/rbac/require-permission"
import { eq } from "drizzle-orm"

const updateSchema = z.object({
  nameEn: z.string().min(1).optional(),
  nameAr: z.string().min(1).optional(),
  descriptionEn: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  pointsCost: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional(),
  streamProductId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await requirePermission("store:read")
  const { id } = await props.params
  const product = await db.query.products.findFirst({ where: eq(products.id, id) })
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(product)
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await requirePermission("store:write")
  const { id } = await props.params

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 })

    const data = parsed.data
    const updateData: any = { updatedAt: new Date() }

    if (data.nameEn !== undefined) updateData.nameEn = data.nameEn
    if (data.nameAr !== undefined) updateData.nameAr = data.nameAr
    if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn || null
    if (data.descriptionAr !== undefined) updateData.descriptionAr = data.descriptionAr || null
    if (data.price !== undefined) updateData.price = data.price.toFixed(2)
    if (data.pointsCost !== undefined) updateData.pointsCost = data.pointsCost ?? null
    if (data.stock !== undefined) updateData.stockQuantity = data.stock
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.streamProductId !== undefined) updateData.streamProductId = data.streamProductId ?? null
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const [updated] = await db.update(products).set(updateData).where(eq(products.id, id)).returning()
    return NextResponse.json({ success: true, product: updated })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await requirePermission("store:write")
  const { id } = await props.params
  await db.delete(products).where(eq(products.id, id))
  return NextResponse.json({ success: true })
}

