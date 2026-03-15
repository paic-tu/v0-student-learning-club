import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lessonAssignmentSubmissions, lessons, modules, courses, users } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"

export async function GET(_req: Request, props: { params: Promise<{ lessonId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "instructor" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { lessonId } = await props.params

  const rows = await db
    .select({
      id: lessonAssignmentSubmissions.id,
      userId: lessonAssignmentSubmissions.userId,
      fileUrl: lessonAssignmentSubmissions.fileUrl,
      fileName: lessonAssignmentSubmissions.fileName,
      fileSize: lessonAssignmentSubmissions.fileSize,
      mimeType: lessonAssignmentSubmissions.mimeType,
      status: lessonAssignmentSubmissions.status,
      submittedAt: lessonAssignmentSubmissions.submittedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(lessonAssignmentSubmissions)
    .innerJoin(users, eq(lessonAssignmentSubmissions.userId, users.id))
    .innerJoin(lessons, eq(lessonAssignmentSubmissions.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(
      session.user.role === "admin"
        ? eq(lessonAssignmentSubmissions.lessonId, lessonId)
        : and(eq(lessonAssignmentSubmissions.lessonId, lessonId), eq(courses.instructorId, session.user.id)),
    )
    .orderBy(desc(lessonAssignmentSubmissions.submittedAt))
    .limit(500)

  return NextResponse.json({ items: rows })
}

