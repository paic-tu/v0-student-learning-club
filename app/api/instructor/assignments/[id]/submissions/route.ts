import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { assignmentSubmissions, assignments, courses, users } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "instructor" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await props.params
  const instructorId = session.user.id

  const assignment = await db
    .select({ id: assignments.id })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(and(eq(assignments.id, id), eq(courses.instructorId, instructorId)))
    .limit(1)

  if (!assignment[0]?.id) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const rows = await db
    .select({
      id: assignmentSubmissions.id,
      userId: assignmentSubmissions.userId,
      fileUrl: assignmentSubmissions.fileUrl,
      fileName: assignmentSubmissions.fileName,
      fileSize: assignmentSubmissions.fileSize,
      mimeType: assignmentSubmissions.mimeType,
      status: assignmentSubmissions.status,
      submittedAt: assignmentSubmissions.submittedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(assignmentSubmissions)
    .innerJoin(users, eq(assignmentSubmissions.userId, users.id))
    .where(eq(assignmentSubmissions.assignmentId, id))
    .orderBy(desc(assignmentSubmissions.submittedAt))
    .limit(500)

  return NextResponse.json({ items: rows })
}

