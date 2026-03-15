import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { courses } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { streamRequest } from "@/lib/payments/stream"

export async function POST(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await requirePermission("courses:write")
  const { id } = await props.params

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, id),
    columns: { id: true, titleEn: true, titleAr: true, price: true, streamProductId: true, isFree: true },
  })
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

  const priceNumber = Number.parseFloat(String(course.price))
  if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
    return NextResponse.json({ error: "Course price must be > 0 to sync for payments" }, { status: 400 })
  }

  const desiredName = course.titleEn || course.titleAr
  const desiredPrice = priceNumber.toFixed(2)

  try {
    if (!course.streamProductId) {
      const created = await streamRequest<any>("/products", {
        method: "POST",
        body: JSON.stringify({ name: desiredName, type: "ONE_OFF", currency: "SAR", price: desiredPrice }),
      })
      const streamProductId = created?.id
      if (!streamProductId) return NextResponse.json({ error: "Stream product id missing" }, { status: 500 })

      await db
        .update(courses)
        .set({
          streamProductId,
          isFree: false,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, course.id))

      return NextResponse.json({ success: true, action: "created", streamProductId, streamProduct: created })
    }

    const patched = await streamRequest<any>(`/products/${course.streamProductId}`, {
      method: "PATCH",
      body: JSON.stringify({ name: desiredName, price: desiredPrice, active: true }),
    })

    await db
      .update(courses)
      .set({
        isFree: false,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, course.id))

    return NextResponse.json({ success: true, action: "updated", streamProductId: course.streamProductId, streamProduct: patched })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to sync course to Stream" }, { status: 500 })
  }
}

