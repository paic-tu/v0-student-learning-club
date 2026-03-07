import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { courses, lessons } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      orderIndex: z.number().int().min(0),
    })
  ),
})

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const courseId = params.id
    
    // Check ownership
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    })

    if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (course.instructorId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { items } = reorderSchema.parse(body)

    if (items.length === 0) {
      return NextResponse.json({ success: true })
    }

    // Update all items
    await Promise.all(
      items.map((item) =>
        db
          .update(lessons)
          .set({ orderIndex: item.orderIndex })
          .where(and(eq(lessons.id, item.id), eq(lessons.courseId, courseId)))
      )
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to reorder lessons:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
