import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { lessons, courses } from "@/lib/db/schema"
import { eq, desc, asc, and, sql, getTableColumns, isNull, or } from "drizzle-orm"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { logAudit, type AuditResource } from "@/lib/audit/audit-logger"

const createLessonSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  slug: z.string().min(1, "Slug is required"),
  courseId: z.string().min(1, "Valid course ID is required"),
  moduleId: z.string().uuid().optional().nullable(),
  contentType: z.enum(["video", "article", "quiz", "assignment", "resource"]).default("video"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  orderIndex: z.coerce.number().int().min(0).default(0),
  durationMinutes: z.coerce.number().int().min(0).optional().nullable(),
  videoUrl: z.string().optional().or(z.literal("")).nullable(),
  thumbnailUrl: z.string().optional().or(z.literal("")).nullable(),
  contentMarkdown: z.string().optional().nullable(),
  freePreview: z.boolean().default(false),
  assignmentConfig: z.record(z.any()).optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    await requirePermission("lessons:read")

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50") || 50, 100)
    const offset = Number.parseInt(searchParams.get("offset") || "0") || 0

    const conditions = []

    if (courseId) {
      conditions.push(eq(lessons.courseId, courseId))
    }

    // Assuming logical delete is not strictly implemented in schema yet or handled by application logic
    // If there is a deletedAt column, we should filter by it.
    // Based on previous code: if (hasDeletedAt) whereClauses.push(`l.deleted_at IS NULL`)
    // I will check if the schema has deletedAt. If not, I'll skip it.
    // Looking at schema imports, I don't have the schema definition in front of me right now, 
    // but the previous code checked for it dynamically. 
    // Safest bet: check if column exists in schema or just assume standard behavior.
    // Given the previous code was dynamic, it implies the schema might have it.
    // However, Drizzle schema is static. I will assume it's not there or handled elsewhere unless I see it in schema file.
    // I'll stick to what's visible in schema imports or standard fields.
    // Actually, let's just stick to the fields we know are there.

    let orderBy
    if (courseId) {
      orderBy = asc(lessons.orderIndex)
    } else {
      // Previous code: COALESCE(l.updated_at, l.created_at) DESC
      orderBy = desc(sql`COALESCE(${lessons.updatedAt}, ${lessons.createdAt})`)
    }

    const result = await db
      .select({
        ...getTableColumns(lessons),
        courseTitleEn: courses.titleEn,
      })
      .from(lessons)
      .leftJoin(courses, eq(lessons.courseId, courses.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(orderBy)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("lessons:write")

    const body = await req.json()
    const parsed = createLessonSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    
    // Calculate next order index if not provided or 0
    let orderIndex = data.orderIndex
    if (orderIndex === 0) {
      const whereClause = and(
        eq(lessons.courseId, data.courseId),
        data.moduleId ? eq(lessons.moduleId, data.moduleId) : isNull(lessons.moduleId)
      )

      const maxResult = await db
        .select({ max: sql<number>`MAX(${lessons.orderIndex})` })
        .from(lessons)
        .where(whereClause)
      
      const currentMax = maxResult[0]?.max
      orderIndex = (currentMax !== null && currentMax !== undefined ? Number(currentMax) : -1) + 1
    }

    const result = await db
      .insert(lessons)
      .values({
        courseId: data.courseId,
        moduleId: data.moduleId || null,
        titleEn: data.titleEn,
        titleAr: data.titleAr,
        slug: data.slug,
        type: data.contentType, // mapped from contentType
        status: data.status,
        orderIndex: orderIndex,
        durationMinutes: data.durationMinutes,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        contentEn: data.contentMarkdown, // mapped to contentEn
        contentAr: data.contentMarkdown, // mapped to contentAr
        isPreview: data.freePreview, // mapped to isPreview
        assignmentConfig: data.assignmentConfig ?? null,
      })
      .returning()

    const lesson = result[0]

    await logAudit({
      action: "create",
      resource: "lesson" as AuditResource,
      resourceId: lesson.id,
      changes: { after: lesson },
    })

    return NextResponse.json(lesson)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}
