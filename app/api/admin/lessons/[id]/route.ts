import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { lessons } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { logAudit, type AuditResource } from "@/lib/audit/audit-logger"
import { extractYouTubeVideoId, toYouTubeStorageValue } from "@/lib/video/youtube"

const updateLessonSchema = z.object({
  titleEn: z.string().min(1).optional(),
  titleAr: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  courseId: z.string().min(1).optional(),
  moduleId: z.string().uuid().optional().nullable(),
  contentType: z.enum(["video", "article", "quiz", "assignment", "resource"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(), // Adjusted to match potential DB values or schema
  orderIndex: z.coerce.number().int().min(0).optional(),
  durationMinutes: z.coerce.number().int().min(0).optional().nullable(),
  videoUrl: z.string().optional().or(z.literal("")).nullable(),
  thumbnailUrl: z.string().optional().or(z.literal("")).nullable(),
  contentMarkdown: z.string().optional().nullable(),
  freePreview: z.boolean().optional(),
  assignmentConfig: z.record(z.any()).optional().nullable(),
})

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("lessons:read")

    const lessonId = params.id
    const idParse = z.string().uuid().safeParse(lessonId)
    if (!idParse.success) {
      return NextResponse.json({ error: "Invalid lesson id" }, { status: 400 })
    }

    const result = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
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

    const existing = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    if (existing.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = updateLessonSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (data.titleEn !== undefined) updateData.titleEn = data.titleEn
    if (data.titleAr !== undefined) updateData.titleAr = data.titleAr
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.courseId !== undefined) updateData.courseId = data.courseId
    if (data.moduleId !== undefined) updateData.moduleId = data.moduleId
    if (data.contentType !== undefined) updateData.type = data.contentType
    if (data.status !== undefined) updateData.status = data.status
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes
    if (data.videoUrl !== undefined) {
      const rawVideoUrl = data.videoUrl ? String(data.videoUrl) : ""
      const youtubeId = extractYouTubeVideoId(rawVideoUrl)
      updateData.videoUrl = youtubeId ? toYouTubeStorageValue(youtubeId) : data.videoUrl
      updateData.videoProvider = youtubeId ? "youtube" : "upload"
    }
    if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl
    if (data.contentMarkdown !== undefined) {
      updateData.contentEn = data.contentMarkdown
      updateData.contentAr = data.contentMarkdown
    }
    if (data.freePreview !== undefined) updateData.isPreview = data.freePreview
    if (data.assignmentConfig !== undefined) updateData.assignmentConfig = data.assignmentConfig

    const result = await db
      .update(lessons)
      .set(updateData)
      .where(eq(lessons.id, lessonId))
      .returning()

    const updated = result[0]

    await logAudit({
      action: "update",
      resource: "lesson" as AuditResource,
      resourceId: lessonId,
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
    await requirePermission("lessons:delete")

    const lessonId = params.id
    const idParse = z.string().uuid().safeParse(lessonId)
    if (!idParse.success) {
      return NextResponse.json({ error: "Invalid lesson id" }, { status: 400 })
    }

    const existing = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    if (existing.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    await db.delete(lessons).where(eq(lessons.id, lessonId))

    await logAudit({
      action: "delete",
      resource: "lesson" as AuditResource,
      resourceId: lessonId,
      changes: { before: existing[0] },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}
