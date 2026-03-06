import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { z } from "zod"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logAudit, type AuditResource } from "@/lib/audit/audit-logger"

const updateStatusSchema = z.object({
  status: z.enum(["pending", "completed", "cancelled"]),
})

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("orders:write")

    const orderId = params.id
    const body = await request.json()
    const { status } = updateStatusSchema.parse(body)

    // Get before state
    const existing = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    
    if (existing.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Update order status
    const result = await db
      .update(orders)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning()

    // Log audit
    await logAudit({
      action: "update",
      resource: "order" as AuditResource,
      resourceId: orderId,
      changes: {
        before: existing[0],
        after: result[0],
      },
    })

    return NextResponse.json(result[0])
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    console.error("[v0] Error updating order:", error)
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}
