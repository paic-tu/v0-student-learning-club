import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { logAudit } from "@/lib/audit/audit-logger"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

const updateCourseSchema = z.object({
  title_en: z.string().min(1).optional(),
  title_ar: z.string().min(1).optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  instructor_id: z.number().optional(),
  category_id: z.number().nullable().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  duration: z.number().optional(),
  price: z.string().optional(),
  is_free: z.boolean().optional(),
  is_published: z.boolean().optional(),
  thumbnail_url: z
    .string()
    .url()
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  video_url: z
    .string()
    .url()
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
})

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("courses:write")

    const courseId = Number.parseInt(params.id)
    const body = await request.json()
    const data = updateCourseSchema.parse(body)

    const beforeState = await sql`SELECT * FROM courses WHERE id = ${courseId} LIMIT 1`

    let query = `UPDATE courses SET `
    const setClauses = []
    const values: any[] = []

    if (data.title_en !== undefined) {
      setClauses.push(`title_en = $${values.length + 1}`)
      values.push(data.title_en)
    }
    if (data.title_ar !== undefined) {
      setClauses.push(`title_ar = $${values.length + 1}`)
      values.push(data.title_ar)
    }
    if (data.description_en !== undefined) {
      setClauses.push(`description_en = $${values.length + 1}`)
      values.push(data.description_en)
    }
    if (data.description_ar !== undefined) {
      setClauses.push(`description_ar = $${values.length + 1}`)
      values.push(data.description_ar)
    }
    if (data.instructor_id !== undefined) {
      setClauses.push(`instructor_id = $${values.length + 1}`)
      values.push(data.instructor_id)
    }
    if (data.category_id !== undefined) {
      setClauses.push(`category_id = $${values.length + 1}`)
      values.push(data.category_id)
    }
    if (data.difficulty !== undefined) {
      setClauses.push(`difficulty = $${values.length + 1}::difficulty`)
      values.push(data.difficulty)
    }
    if (data.duration !== undefined) {
      setClauses.push(`duration = $${values.length + 1}`)
      values.push(data.duration)
    }
    if (data.price !== undefined) {
      setClauses.push(`price = $${values.length + 1}`)
      values.push(data.price)
    }
    if (data.is_free !== undefined) {
      setClauses.push(`is_free = $${values.length + 1}`)
      values.push(data.is_free)
    }
    if (data.is_published !== undefined) {
      setClauses.push(`is_published = $${values.length + 1}`)
      values.push(data.is_published)
    }
    if (data.thumbnail_url !== undefined) {
      setClauses.push(`thumbnail_url = $${values.length + 1}`)
      values.push(data.thumbnail_url)
    }
    if (data.video_url !== undefined) {
      setClauses.push(`video_url = $${values.length + 1}`)
      values.push(data.video_url)
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    query += setClauses.join(", ") + `, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`
    values.push(courseId)

    const result = await sql.query(query, values)

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
    }

    await logAudit({
      action: data.is_published !== undefined ? (data.is_published ? "publish" : "unpublish") : "update",
      resource: "course",
      resourceId: courseId,
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

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { params } = props
  try {
    await requirePermission("courses:delete")

    const courseId = Number.parseInt(await params)

    const beforeState = await sql`SELECT * FROM courses WHERE id = ${courseId} LIMIT 1`

    await sql`DELETE FROM courses WHERE id = ${courseId}`

    await logAudit({
      action: "delete",
      resource: "course",
      resourceId: courseId,
      changes: {
        before: beforeState[0],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}
