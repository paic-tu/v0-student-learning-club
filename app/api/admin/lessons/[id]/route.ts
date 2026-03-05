import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { canManageLessons } from "@/lib/rbac/permissions"
import { logAudit } from "@/lib/audit/audit-logger"
import { z } from "zod"

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageLessons(user.role as any)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const lessonId = id

    const result = await sql`
      SELECT 
        l.*,
        c.title_en as course_title_en
      FROM lessons l
      LEFT JOIN courses c ON l.course_id = c.id
      WHERE l.id = ${lessonId}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Failed to fetch lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageLessons(user.role as any)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const lessonId = id

    const body = await req.json()
    const parseResult = updateLessonSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 400 })
    }

    // Get current state for audit
    const currentResult = await sql`SELECT * FROM lessons WHERE id = ${lessonId} LIMIT 1`
    if (currentResult.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }
    const before = currentResult[0]

    const data = parseResult.data
    const columns = await getLessonColumns()
    const values: any[] = []
    const setClauses: string[] = []

    const addSet = (column: string, value: any) => {
      if (!columns.has(column)) return
      values.push(value)
      setClauses.push(`${column} = $${values.length}`)
    }

    if (data.titleEn !== undefined) addSet("title_en", data.titleEn)
    if (data.titleAr !== undefined) addSet("title_ar", data.titleAr)
    if (data.slug !== undefined) addSet("slug", data.slug)
    if (data.courseId !== undefined) addSet("course_id", data.courseId)
    if (data.moduleId !== undefined) addSet("module_id", data.moduleId)
    if (data.contentType !== undefined) {
      addSet("content_type", data.contentType)
      addSet("type", data.contentType)
    }
    if (data.status !== undefined) addSet("status", data.status)
    if (data.orderIndex !== undefined) addSet("order_index", data.orderIndex)

    if (data.durationMinutes !== undefined) {
      addSet("duration", data.durationMinutes)
      addSet("duration_minutes", data.durationMinutes)
    }

    if (data.videoUrl !== undefined) addSet("video_url", data.videoUrl)
    if (data.thumbnailUrl !== undefined) addSet("thumbnail_url", data.thumbnailUrl)
    if (data.contentMarkdown !== undefined) addSet("content_markdown", data.contentMarkdown)

    if (data.freePreview !== undefined) {
      addSet("is_preview", data.freePreview)
      addSet("free_preview", data.freePreview)
    }

    if (columns.has("updated_at")) {
      setClauses.push(`updated_at = NOW()`)
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    values.push(lessonId)
    const query = `UPDATE lessons SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING *`
    const result = await sql.query(query, values)

    const after = result[0]

    await logAudit({
      action: "update",
      resource: "lesson",
      resourceId: lessonId,
      changes: { before, after },
    })

    return NextResponse.json(after)
  } catch (error) {
    console.error("[v0] Failed to update lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageLessons(user.role as any)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const lessonId = id

    const columns = await getLessonColumns()
    const hasDeletedAt = columns.has("deleted_at")
    const hasUpdatedAt = columns.has("updated_at")

    let result: any[]
    if (hasDeletedAt) {
      const setClauses = [`deleted_at = NOW()`]
      if (hasUpdatedAt) setClauses.push(`updated_at = NOW()`)
      result = await sql.query(
        `UPDATE lessons SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *`,
        [lessonId],
      )
    } else {
      result = await sql.query(`DELETE FROM lessons WHERE id = $1 RETURNING *`, [lessonId])
    }

    if (result.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    await logAudit({
      action: "soft_delete",
      resource: "lesson",
      resourceId: lessonId,
      changes: { before: result[0] },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete lesson:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
