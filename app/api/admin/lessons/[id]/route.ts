import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { canManageLessons } from "@/lib/rbac/permissions"
import { logAudit } from "@/lib/audit/audit-logger"
import { z } from "zod"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

const updateLessonSchema = z.object({
  titleEn: z.string().min(1).optional(),
  titleAr: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  courseId: z.coerce.number().int().positive().optional(),
  contentType: z.enum(["video", "article", "quiz", "assignment"]).optional(),
  status: z.enum(["draft", "published"]).optional(),
  orderIndex: z.coerce.number().int().min(0).optional(),
  durationMinutes: z.coerce.number().int().min(0).optional().nullable(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  contentMarkdown: z.string().optional(),
  freePreview: z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageLessons(user.role as any)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const lessonId = Number.parseInt(id)

    if (isNaN(lessonId) || lessonId <= 0) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 })
    }

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
    const lessonId = Number.parseInt(id)

    if (isNaN(lessonId) || lessonId <= 0) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 })
    }

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

    const result = await sql`
      UPDATE lessons SET
        title_en = COALESCE(${data.titleEn}, title_en),
        title_ar = COALESCE(${data.titleAr}, title_ar),
        slug = COALESCE(${data.slug}, slug),
        course_id = COALESCE(${data.courseId}, course_id),
        content_type = COALESCE(${data.contentType}, content_type),
        status = COALESCE(${data.status}, status),
        order_index = COALESCE(${data.orderIndex}, order_index),
        duration_minutes = COALESCE(${data.durationMinutes}, duration_minutes),
        duration = COALESCE(${data.durationMinutes}, duration),
        video_url = COALESCE(${data.videoUrl}, video_url),
        content_markdown = COALESCE(${data.contentMarkdown}, content_markdown),
        free_preview = COALESCE(${data.freePreview}, free_preview),
        is_preview = COALESCE(${data.freePreview}, is_preview),
        updated_at = NOW()
      WHERE id = ${lessonId}
      RETURNING *
    `

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
    const lessonId = Number.parseInt(id)

    if (isNaN(lessonId) || lessonId <= 0) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 })
    }

    // Soft delete
    const result = await sql`
      UPDATE lessons 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = ${lessonId}
      RETURNING *
    `

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
