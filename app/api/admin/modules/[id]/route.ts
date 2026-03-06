import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { modules, lessons } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { logAudit, type AuditResource } from "@/lib/audit/audit-logger"

const updateModuleSchema = z.object({
  titleEn: z.string().min(1).optional(),
  titleAr: z.string().min(1).optional(),
  orderIndex: z.coerce.number().int().min(0).optional(),
})

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("courses:read")

    const moduleId = params.id
    const idParse = z.string().uuid().safeParse(moduleId)
    if (!idParse.success) {
      return NextResponse.json({ error: "Invalid module id" }, { status: 400 })
    }

    const result = await db.select().from(modules).where(eq(modules.id, moduleId)).limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("courses:write")

    const moduleId = params.id
    const idParse = z.string().uuid().safeParse(moduleId)
    if (!idParse.success) {
      return NextResponse.json({ error: "Invalid module id" }, { status: 400 })
    }

    const existing = await db.select().from(modules).where(eq(modules.id, moduleId)).limit(1)
    if (existing.length === 0) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = updateModuleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const updateData: any = {}
    if (data.titleEn !== undefined) updateData.titleEn = data.titleEn
    if (data.titleAr !== undefined) updateData.titleAr = data.titleAr
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex

    const result = await db
      .update(modules)
      .set(updateData)
      .where(eq(modules.id, moduleId))
      .returning()

    const updated = result[0]

    await logAudit({
      action: "update",
      resource: "module" as AuditResource,
      resourceId: moduleId,
      changes: { before: existing[0], after: updated },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("courses:write")

    const moduleId = params.id
    const idParse = z.string().uuid().safeParse(moduleId)
    if (!idParse.success) {
      return NextResponse.json({ error: "Invalid module id" }, { status: 400 })
    }

    const existing = await db.select().from(modules).where(eq(modules.id, moduleId)).limit(1)
    if (existing.length === 0) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Check if module has lessons
    const usage = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.moduleId, moduleId)).limit(1)
    
    if (usage.length > 0) {
      return NextResponse.json({ error: "Cannot delete module with associated lessons" }, { status: 409 })
    }

    await db.delete(modules).where(eq(modules.id, moduleId))

    await logAudit({
      action: "delete",
      resource: "module" as AuditResource,
      resourceId: moduleId,
      changes: { before: existing[0] },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}
