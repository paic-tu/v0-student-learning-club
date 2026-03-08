import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lessons, courses } from "@/lib/db/schema"
import { eq, and, sql, desc, asc } from "drizzle-orm"
import { z } from "zod"

const createLessonSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  slug: z.string().min(1, "Slug is required"),
  moduleId: z.string().uuid().optional().nullable(),
  contentType: z.enum(["video", "article", "quiz", "assignment", "resource"]).default("video"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  orderIndex: z.coerce.number().int().min(0).default(0),
  durationMinutes: z.coerce.number().int().min(0).optional().nullable(),
  videoUrl: z.string().optional().or(z.literal("")).nullable(),
  thumbnailUrl: z.string().optional().or(z.literal("")).nullable(),
  contentMarkdown: z.string().optional().nullable(),
  freePreview: z.boolean().default(false),
  quizConfig: z.record(z.any()).optional().nullable(),
  quizId: z.string().uuid().optional().nullable(),
})

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const courseId = params.id

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

    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get("moduleId")

    const conditions = [eq(lessons.courseId, courseId)]
    if (moduleId) {
      conditions.push(eq(lessons.moduleId, moduleId))
    }

    const result = await db
      .select()
      .from(lessons)
      .where(and(...conditions))
      .orderBy(asc(lessons.orderIndex))

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Error fetching lessons:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const courseId = params.id

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
    const parsed = createLessonSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const { contentMarkdown, quizId, contentType, ...rest } = data
    const insertData: any = { ...rest, type: contentType }

    if (quizId) {
      insertData.quizConfig = { ...insertData.quizConfig, quizId }
    }

    // Map contentMarkdown to contentEn and contentAr
    if (contentMarkdown !== undefined && contentMarkdown !== null) {
      insertData.contentEn = contentMarkdown
      insertData.contentAr = contentMarkdown
    }

    // Get max order index if not provided
    let orderIndex = data.orderIndex
    if (orderIndex === 0) {
        const existingLessons = await db
            .select({ orderIndex: lessons.orderIndex })
            .from(lessons)
            .where(eq(lessons.courseId, courseId))
            .orderBy(desc(lessons.orderIndex))
            .limit(1)
        
        if (existingLessons.length > 0) {
            orderIndex = existingLessons[0].orderIndex + 1
        }
    }

    const [newLesson] = await db
      .insert(lessons)
      .values({
        ...insertData,
        courseId, // Add courseId from params
        slug: insertData.slug || `${Date.now()}`, // Fallback slug if empty (though schema requires it)
      })
      .returning()

    return NextResponse.json(newLesson)
  } catch (error: any) {
    console.error("[v0] Error creating lesson:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
