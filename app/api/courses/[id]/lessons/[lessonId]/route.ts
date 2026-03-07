import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lessons, courses } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const updateLessonSchema = z.object({
  titleEn: z.string().min(1).optional(),
  titleAr: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  moduleId: z.string().uuid().optional().nullable(),
  contentType: z.enum(["video", "article", "quiz", "assignment", "resource"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  orderIndex: z.coerce.number().int().min(0).optional(),
  durationMinutes: z.coerce.number().int().min(0).optional().nullable(),
  videoUrl: z.string().optional().or(z.literal("")).nullable(),
  thumbnailUrl: z.string().optional().or(z.literal("")).nullable(),
  contentMarkdown: z.string().optional().nullable(),
  freePreview: z.boolean().optional(),
})

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string; lessonId: string }> }
) {
  const params = await props.params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId, lessonId } = params

    // Verify course ownership
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      columns: { instructorId: true },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (course.instructorId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const lesson = await db.query.lessons.findFirst({
      where: and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)),
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json(lesson)
  } catch (error: any) {
    console.error("[v0] Error fetching lesson:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string; lessonId: string }> }
) {
  const params = await props.params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId, lessonId } = params

    // Verify course ownership
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      columns: { instructorId: true },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (course.instructorId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updateLessonSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
    }

    const { contentMarkdown, ...rest } = parsed.data
    const updateData: any = { ...rest }

    // Map contentMarkdown to contentEn and contentAr
    if (contentMarkdown !== undefined && contentMarkdown !== null) {
      updateData.contentEn = contentMarkdown
      updateData.contentAr = contentMarkdown
    }

    const [updatedLesson] = await db
      .update(lessons)
      .set(updateData)
      .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)))
      .returning()

    if (!updatedLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json(updatedLesson)
  } catch (error: any) {
    console.error("[v0] Error updating lesson:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string; lessonId: string }> }
) {
  const params = await props.params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId, lessonId } = params

    // Verify course ownership
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      columns: { instructorId: true },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (course.instructorId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [deletedLesson] = await db
      .delete(lessons)
      .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)))
      .returning()

    if (!deletedLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json(deletedLesson)
  } catch (error: any) {
    console.error("[v0] Error deleting lesson:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
