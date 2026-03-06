import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { enrollments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logAudit, type AuditResource } from "@/lib/audit/audit-logger"

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    await requirePermission("enrollments:delete")

    const id = params.id

    // Get existing enrollment for audit log
    const existing = await db.select().from(enrollments).where(eq(enrollments.id, id)).limit(1)
    
    if (existing.length === 0) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    // Delete enrollment
    await db.delete(enrollments).where(eq(enrollments.id, id))

    // Log audit
    await logAudit({
      action: "delete",
      resource: "enrollment" as AuditResource,
      resourceId: id,
      changes: {
        before: existing[0],
        after: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting enrollment:", error)
    return NextResponse.json({ error: error.message || "Failed to delete enrollment" }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}
