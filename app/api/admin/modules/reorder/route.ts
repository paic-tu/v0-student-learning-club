import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { z } from "zod"
import { db } from "@/lib/db"
import { modules } from "@/lib/db/schema"
import { eq, inArray } from "drizzle-orm"
import { logAudit, type AuditResource } from "@/lib/audit/audit-logger"

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      orderIndex: z.number().int().min(0),
    })
  ),
})

export async function PUT(req: NextRequest) {
  try {
    await requirePermission("courses:write") // Modules are part of courses

    const body = await req.json()
    const { items } = reorderSchema.parse(body)

    if (items.length === 0) {
      return NextResponse.json({ success: true })
    }

    // Get course ID for audit log (from first module)
    const firstModule = await db.query.modules.findFirst({
      where: eq(modules.id, items[0].id),
      columns: { courseId: true },
    })

    await Promise.all(
      items.map((item) =>
        db
          .update(modules)
          .set({ orderIndex: item.orderIndex })
          .where(eq(modules.id, item.id))
      )
    )

    if (firstModule?.courseId) {
      await logAudit({
        action: "update",
        resource: "course" as AuditResource,
        resourceId: firstModule.courseId,
        details: { action: "reorder_modules", count: items.length },
        changes: {
            before: null,
            after: items
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Failed to reorder modules:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message },
      { status: error.name === "ForbiddenError" ? 403 : 500 }
    )
  }
}
