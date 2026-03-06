import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { z } from "zod"
import { logAudit } from "@/lib/audit/audit-logger"
import { db } from "@/lib/db"
import { courses } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const updateCourseSchema = z.object({
  title_en: z.string().min(1).optional(),
  title_ar: z.string().min(1).optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  subtitle_en: z.string().optional(),
  subtitle_ar: z.string().optional(),
  language: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  learning_outcomes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  instructor_id: z.string().uuid().optional(),
  category_id: z.string().uuid().nullable().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  duration: z.number().finite().nonnegative().optional(),
  price: z.coerce.number().min(0).optional(),
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

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("courses:read")

    const courseId = params.id

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      with: {
        category: true,
        instructor: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error: any) {
    console.error("[v0] Error fetching course:", error)
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("courses:write")

    const courseId = params.id
    const body = await request.json()
    const data = updateCourseSchema.parse(body)

    const existing = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    })

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (data.title_en !== undefined) updateData.titleEn = data.title_en
    if (data.title_ar !== undefined) updateData.titleAr = data.title_ar
    if (data.description_en !== undefined) updateData.descriptionEn = data.description_en
    if (data.description_ar !== undefined) updateData.descriptionAr = data.description_ar
    if (data.subtitle_en !== undefined) updateData.subtitleEn = data.subtitle_en
    if (data.subtitle_ar !== undefined) updateData.subtitleAr = data.subtitle_ar
    if (data.language !== undefined) updateData.language = data.language
    if (data.requirements !== undefined) updateData.requirements = data.requirements
    if (data.learning_outcomes !== undefined) updateData.learningOutcomes = data.learning_outcomes
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.instructor_id !== undefined) updateData.instructorId = data.instructor_id
    if (data.category_id !== undefined) updateData.categoryId = data.category_id
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty
    if (data.duration !== undefined) updateData.duration = data.duration
    if (data.price !== undefined) updateData.price = data.price.toString() // Drizzle expects string for decimal
    if (data.is_free !== undefined) updateData.isFree = data.is_free
    if (data.is_published !== undefined) updateData.isPublished = data.is_published
    if (data.thumbnail_url !== undefined) updateData.thumbnailUrl = data.thumbnail_url
    if (data.video_url !== undefined) updateData.previewVideoUrl = data.video_url

    const result = await db
      .update(courses)
      .set(updateData)
      .where(eq(courses.id, courseId))
      .returning()

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
    }

    await logAudit({
      action: data.is_published !== undefined ? (data.is_published ? "publish" : "unpublish") : "update",
      resource: "course",
      resourceId: courseId,
      changes: {
        before: existing,
        after: result[0],
      },
    })

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("[v0] Failed to update course:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { params } = props
  try {
    await requirePermission("courses:delete")

    const courseId = (await params).id

    const existing = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    })

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    await db.delete(courses).where(eq(courses.id, courseId))

    await logAudit({
      action: "delete",
      resource: "course",
      resourceId: courseId,
      changes: {
        before: existing,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}
