import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { z } from "zod"
import { logAudit } from "@/lib/audit/audit-logger"
import { db } from "@/lib/db"
import { lessons } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

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
    const result = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
      with: {
        // We can't easily join courses here without defining relation in schema.ts properly
        // Assuming relations are defined or we fetch separately.
        // For now, just return lesson.
      },
    })

    if (!result) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json(result)
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
    const body = await req.json()
    const data = updateLessonSchema.parse(body)

    const existing = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
    })

    if (!existing) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

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
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl
    if (data.contentMarkdown !== undefined) updateData.contentEn = data.contentMarkdown
    if (data.freePreview !== undefined) updateData.isPreview = data.freePreview

    const result = await db
      .update(lessons)
      .set(updateData)
      .where(eq(lessons.id, lessonId))
      .returning()

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 })
    }

    await logAudit({
      action: "update",
      resource: "lesson",
      resourceId: lessonId,
      changes: {
        before: existing,
        after: result[0],
      },
    })

    return NextResponse.json(result[0])
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

    const existing = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
    })

    if (!existing) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    await db.delete(lessons).where(eq(lessons.id, lessonId))

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
