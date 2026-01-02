import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { canManageLessons } from "@/lib/rbac/permissions"
import { logAudit } from "@/lib/audit/audit-logger"
import { z } from "zod"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

const createLessonSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  slug: z.string().min(1, "Slug is required"),
  courseId: z.coerce.number().int().positive("Valid course ID is required"),
  contentType: z.enum(["video", "article", "quiz", "assignment"]).default("video"),
  status: z.enum(["draft", "published"]).default("draft"),
  orderIndex: z.coerce.number().int().min(0).default(0),
  durationMinutes: z.coerce.number().int().min(0).optional().nullable(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  contentMarkdown: z.string().optional(),
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

    const result = await sql`
      INSERT INTO lessons (
        course_id,
        title_en,
        title_ar,
        slug,
        content_type,
        status,
        order_index,
        duration,
        duration_minutes,
        video_url,
        content_markdown,
        is_preview,
        free_preview,
        created_at,
        updated_at
      )
      VALUES (
        ${data.courseId},
        ${data.titleEn},
        ${data.titleAr},
        ${data.slug},
        ${data.contentType},
        ${data.status},
        ${data.orderIndex},
        ${data.durationMinutes || null},
        ${data.durationMinutes || null},
        ${data.videoUrl || null},
        ${data.contentMarkdown || null},
        ${data.freePreview},
        ${data.freePreview},
        NOW(),
        NOW()
      )
      RETURNING *
    `

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
    const status = searchParams.get("status")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50") || 50, 100)
    const offset = Number.parseInt(searchParams.get("offset") || "0") || 0

    let lessons
    if (courseId && !isNaN(Number.parseInt(courseId))) {
      lessons = await sql`
        SELECT 
          l.*,
          c.title_en as course_title_en
        FROM lessons l
        LEFT JOIN courses c ON l.course_id = c.id
        WHERE l.course_id = ${Number.parseInt(courseId)}
        AND (l.deleted_at IS NULL)
        ORDER BY l.order_index ASC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      lessons = await sql`
        SELECT 
          l.*,
          c.title_en as course_title_en
        FROM lessons l
        LEFT JOIN courses c ON l.course_id = c.id
        WHERE l.deleted_at IS NULL
        ORDER BY COALESCE(l.updated_at, l.created_at) DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return NextResponse.json(lessons)
  } catch (error) {
    console.error("[v0] Failed to fetch lessons:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
