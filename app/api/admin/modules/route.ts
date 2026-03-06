import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { logAudit, type AuditResource } from "@/lib/audit/audit-logger"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

const createModuleSchema = z.object({
  courseId: z.string().uuid(),
  titleEn: z.string().min(1),
  titleAr: z.string().min(1),
})

export async function GET(req: NextRequest) {
  try {
    await requirePermission("courses:read")

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")

    if (courseId) {
      const parsed = z.string().uuid().safeParse(courseId)
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid courseId" }, { status: 400 })
      }
    }

    const modulesList = courseId
      ? await sql`
          SELECT * FROM modules
          WHERE course_id = ${courseId}
          ORDER BY order_index ASC
        `
      : await sql`
          SELECT * FROM modules
          ORDER BY created_at DESC
          LIMIT 200
        `

    return NextResponse.json(modulesList)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("courses:write")

    const body = await req.json()
    const parsed = createModuleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const maxRow = await sql`
      SELECT COALESCE(MAX(order_index), -1) as max
      FROM modules
      WHERE course_id = ${data.courseId}
    `
    const orderIndex = Number(maxRow?.[0]?.max ?? -1) + 1

    const result = await sql`
      INSERT INTO modules (course_id, title_en, title_ar, order_index, created_at)
      VALUES (${data.courseId}, ${data.titleEn}, ${data.titleAr}, ${orderIndex}, NOW())
      RETURNING *
    `

    const moduleRow = result[0]

    await logAudit({
      action: "create",
      resource: "module" as AuditResource,
      resourceId: moduleRow.id,
      changes: { after: moduleRow },
    })

    return NextResponse.json(moduleRow)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}
