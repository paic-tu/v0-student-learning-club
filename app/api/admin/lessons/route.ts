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

const createLessonSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  slug: z.string().min(1, "Slug is required"),
  courseId: z.string().min(1, "Valid course ID is required"),
  moduleId: z.string().uuid().optional().nullable(),
  contentType: z.enum(["video", "article", "quiz", "assignment"]).default("video"),
  status: z.enum(["draft", "published"]).default("draft"),
  orderIndex: z.coerce.number().int().min(0).default(0),
  durationMinutes: z.coerce.number().int().min(0).optional().nullable(),
  videoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")).nullable(),
  contentMarkdown: z.string().optional().nullable(),
  freePreview: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageLessons(user.role as any)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()

    const parseResult = createLessonSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 400 })
    }

    const data = parseResult.data
    const slug = data.slug?.trim()
    if (!slug) {
      return NextResponse.json({ error: "Validation failed", details: { fieldErrors: { slug: ["Slug is required"] } } }, { status: 400 })
    }

    const columns = await getLessonColumns()

    const insertColumns: string[] = []
    const insertValues: any[] = []

    const add = (column: string, value: any) => {
      if (!columns.has(column)) return
      insertColumns.push(column)
      insertValues.push(value)
    }

    add("course_id", data.courseId)
    add("module_id", data.moduleId || null)
    add("title_en", data.titleEn)
    add("title_ar", data.titleAr)
    add("content_en", null)
    add("content_ar", null)
    add("video_url", data.videoUrl || null)
    add("duration", data.durationMinutes ?? null)
    add("order_index", data.orderIndex)
    add("is_preview", data.freePreview)
    add("slug", data.slug)
    add("content_type", data.contentType)
    add("type", data.contentType)
    add("status", data.status)
    add("duration_minutes", data.durationMinutes ?? null)
    add("thumbnail_url", data.thumbnailUrl || null)
    add("content_markdown", data.contentMarkdown || null)
    add("free_preview", data.freePreview)
    add("created_at", new Date())
    add("updated_at", new Date())

    const placeholders = insertValues.map((_, idx) => `$${idx + 1}`).join(", ")
    const query = `INSERT INTO lessons (${insertColumns.join(", ")}) VALUES (${placeholders}) RETURNING *`
    const result = await sql.query(query, insertValues)

    const lesson = result[0]

    await logAudit({
      action: "create",
      resource: "lesson",
      resourceId: lesson.id,
      changes: { after: lesson },
    })

    return NextResponse.json(lesson)
  } catch (error) {
    console.error("[v0] Failed to create lesson:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageLessons(user.role as any)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50") || 50, 100)
    const offset = Number.parseInt(searchParams.get("offset") || "0") || 0

    const columns = await getLessonColumns()
    const hasDeletedAt = columns.has("deleted_at")
    const hasUpdatedAt = columns.has("updated_at")

    const courseIdNumber = courseId && !isNaN(Number.parseInt(courseId)) ? Number.parseInt(courseId) : null

    const whereClauses: string[] = []
    const values: any[] = []
    const addValue = (value: any) => {
      values.push(value)
      return `$${values.length}`
    }

    if (courseIdNumber !== null) {
      whereClauses.push(`l.course_id = ${addValue(courseIdNumber)}`)
    }

    if (hasDeletedAt) {
      whereClauses.push(`l.deleted_at IS NULL`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""
    const orderBy = courseIdNumber !== null
      ? "ORDER BY l.order_index ASC"
      : hasUpdatedAt
        ? "ORDER BY COALESCE(l.updated_at, l.created_at) DESC"
        : "ORDER BY l.created_at DESC"

    const query = `
      SELECT 
        l.*,
        c.title_en as course_title_en
      FROM lessons l
      LEFT JOIN courses c ON l.course_id = c.id
      ${whereSql}
      ${orderBy}
      LIMIT ${addValue(limit)} OFFSET ${addValue(offset)}
    `

    const lessons = await sql.query(query, values)

    return NextResponse.json(lessons)
  } catch (error) {
    console.error("[v0] Failed to fetch lessons:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
