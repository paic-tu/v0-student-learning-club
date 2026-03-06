import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { logAudit } from "@/lib/audit/audit-logger"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)
let cachedLessonColumns: Set<string> | null = null

async function getLessonColumns() {
  if (cachedLessonColumns) return cachedLessonColumns
  const rows = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lessons'
  `
  cachedLessonColumns = new Set(rows.map((r: any) => r.column_name))
  return cachedLessonColumns
}

const updateLessonSchema = z.object({
  titleEn: z.string().min(1).optional(),
  titleAr: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  courseId: z.string().min(1).optional(),
  moduleId: z.string().uuid().optional().nullable(),
  contentType: z.enum(["video", "article", "quiz", "assignment"]).optional(),
  status: z.enum(["draft", "published"]).optional(),
  orderIndex: z.coerce.number().int().min(0).optional(),
  durationMinutes: z.coerce.number().int().min(0).optional().nullable(),
  videoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")).nullable(),
  contentMarkdown: z.string().optional().nullable(),
  freePreview: z.boolean().optional(),
})

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("lessons:read")

    const lessonId = params.id
    const idParse = z.string().uuid().safeParse(lessonId)
    if (!idParse.success) {
      return NextResponse.json({ error: "Invalid lesson id" }, { status: 400 })
    }

    const result = await sql`SELECT * FROM lessons WHERE id = ${lessonId} LIMIT 1`

    if (result.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("[v0] Failed to fetch lesson:", error)
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("lessons:write")

    const lessonId = params.id
    const idParse = z.string().uuid().safeParse(lessonId)
    if (!idParse.success) {
      return NextResponse.json({ error: "Invalid lesson id" }, { status: 400 })
    }

    const body = await req.json()
    const data = updateLessonSchema.parse(body)

    const existingRows = await sql`SELECT * FROM lessons WHERE id = ${lessonId} LIMIT 1`
    const existing = existingRows[0]
    if (!existing) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const columns = await getLessonColumns()
    const setFragments: string[] = []
    const values: any[] = [lessonId]
    const add = (column: string, value: any) => {
      if (!columns.has(column)) return
      setFragments.push(`${column} = $${values.length + 1}`)
      values.push(value)
    }

    if (data.titleEn !== undefined) add("title_en", data.titleEn)
    if (data.titleAr !== undefined) add("title_ar", data.titleAr)
    if (data.slug !== undefined) add("slug", data.slug)
    if (data.courseId !== undefined) add("course_id", data.courseId)
    if (data.moduleId !== undefined) add("module_id", data.moduleId)
    if (data.contentType !== undefined) {
      add("content_type", data.contentType)
      add("type", data.contentType)
    }
    if (data.status !== undefined) add("status", data.status)
    if (data.orderIndex !== undefined) add("order_index", data.orderIndex)
    if (data.durationMinutes !== undefined) {
      add("duration_minutes", data.durationMinutes)
      add("duration", data.durationMinutes)
    }
    if (data.videoUrl !== undefined) add("video_url", data.videoUrl || null)
    if (data.thumbnailUrl !== undefined) add("thumbnail_url", data.thumbnailUrl || null)
    if (data.contentMarkdown !== undefined) {
      add("content_en", data.contentMarkdown || null)
      add("content_markdown", data.contentMarkdown || null)
    }
    if (data.freePreview !== undefined) {
      add("free_preview", data.freePreview)
      add("is_preview", data.freePreview)
    }

    if (setFragments.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    add("updated_at", new Date())

    const query = `UPDATE lessons SET ${setFragments.join(", ")} WHERE id = $1 RETURNING *`
    const updatedRows = await sql.query(query, values)
    const updated = updatedRows[0]
    if (!updated) {
      return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 })
    }

    await logAudit({
      action: "update",
      resource: "lesson",
      resourceId: lessonId,
      changes: {
        before: existing,
        after: updated,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("[v0] Failed to update lesson:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("lessons:delete")

    const lessonId = params.id
    const idParse = z.string().uuid().safeParse(lessonId)
    if (!idParse.success) {
      return NextResponse.json({ error: "Invalid lesson id" }, { status: 400 })
    }

    const existingRows = await sql`SELECT * FROM lessons WHERE id = ${lessonId} LIMIT 1`
    const existing = existingRows[0]
    if (!existing) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    await sql`DELETE FROM lessons WHERE id = ${lessonId}`

    await logAudit({
      action: "delete",
      resource: "lesson",
      resourceId: lessonId,
      changes: {
        before: existing,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Failed to delete lesson:", error)
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}
