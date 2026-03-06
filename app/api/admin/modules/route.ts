import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { modules } from "@/lib/db/schema"
import { eq, desc, asc, sql } from "drizzle-orm"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { logAudit, type AuditResource } from "@/lib/audit/audit-logger"

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

    let query = db.select().from(modules).$dynamic()

    if (courseId) {
      query = query.where(eq(modules.courseId, courseId)).orderBy(asc(modules.orderIndex))
    } else {
      query = query.orderBy(desc(modules.createdAt)).limit(200)
    }

    const result = await query

    return NextResponse.json(result)
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

    // Get max order index
    const maxResult = await db
      .select({ max: sql<number>`MAX(${modules.orderIndex})` })
      .from(modules)
      .where(eq(modules.courseId, data.courseId))

    const currentMax = maxResult[0]?.max
    const orderIndex = (currentMax !== null && currentMax !== undefined ? Number(currentMax) : -1) + 1

    const result = await db
      .insert(modules)
      .values({
        courseId: data.courseId,
        titleEn: data.titleEn,
        titleAr: data.titleAr,
        orderIndex: orderIndex,
      })
      .returning()

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
