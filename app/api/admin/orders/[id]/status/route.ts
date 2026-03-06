import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { logAudit } from "@/lib/audit/audit-logger"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

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
    const beforeState = await sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`

    // Update order status
    const result = await sql`
      UPDATE orders
      SET status = ${status}::order_status,
          completed_at = ${status === "completed" ? sql`NOW()` : null}
      WHERE id = ${orderId}
      RETURNING *
    `

    // Log audit
    await logAudit({
      action: "update",
      resource: "order",
      resourceId: orderId,
      changes: {
        before: beforeState[0],
        after: result[0],
      },
    })

    return NextResponse.json(result[0])
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}
