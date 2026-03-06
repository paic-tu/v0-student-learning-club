import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { logAudit } from "@/lib/audit/audit-logger"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

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

    const rows = await sql`SELECT * FROM modules WHERE id = ${moduleId} LIMIT 1`
    if (rows.length === 0) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
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

    const existing = await sql`SELECT * FROM modules WHERE id = ${moduleId} LIMIT 1`
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

    const result = await sql`
      UPDATE modules SET
        title_en = COALESCE(${data.titleEn ?? null}, title_en),
        title_ar = COALESCE(${data.titleAr ?? null}, title_ar),
        order_index = COALESCE(${data.orderIndex ?? null}, order_index)
      WHERE id = ${moduleId}
      RETURNING *
    `

    const updated = result[0]

    await logAudit({
      action: "update",
      resource: "module",
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

    const existing = await sql`SELECT * FROM modules WHERE id = ${moduleId} LIMIT 1`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    const usage = await sql`SELECT 1 FROM lessons WHERE module_id = ${moduleId} LIMIT 1`
    if (usage.length > 0) {
      return NextResponse.json({ error: "Cannot delete module with associated lessons" }, { status: 409 })
    }

    await sql`DELETE FROM modules WHERE id = ${moduleId}`

    await logAudit({
      action: "delete",
      resource: "module",
      resourceId: moduleId,
      changes: { before: existing[0] },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

