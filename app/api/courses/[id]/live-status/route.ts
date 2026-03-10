import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { courses } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { isStreaming } = await req.json()

    // Verify course ownership
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, id),
    })

    if (!course) {
      return new NextResponse("Not Found", { status: 404 })
    }

    if (course.instructorId !== session.user.id && session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await db.update(courses)
      .set({ isStreaming })
      .where(eq(courses.id, id))

    return NextResponse.json({ success: true, isStreaming })
  } catch (error) {
    console.error("[COURSE_LIVE_STATUS]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
