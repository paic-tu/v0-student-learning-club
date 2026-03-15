import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { assignmentSubmissions, assignments, courses, enrollments } from "@/lib/db/schema"
import { and, desc, eq, inArray } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const enrolled = await db.query.enrollments.findMany({
    where: eq(enrollments.userId, userId),
    columns: { courseId: true },
  })
  const courseIds = enrolled.map((e) => e.courseId).filter(Boolean) as string[]
  if (courseIds.length === 0) return NextResponse.json({ items: [] })

  const rows = await db
    .select({
      id: assignments.id,
      courseId: assignments.courseId,
      titleEn: assignments.titleEn,
      titleAr: assignments.titleAr,
      dueAt: assignments.dueAt,
      isPublished: assignments.isPublished,
      createdAt: assignments.createdAt,
      courseTitleEn: courses.titleEn,
      courseTitleAr: courses.titleAr,
      submissionId: assignmentSubmissions.id,
      submittedAt: assignmentSubmissions.submittedAt,
      submissionStatus: assignmentSubmissions.status,
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .leftJoin(
      assignmentSubmissions,
      and(eq(assignmentSubmissions.assignmentId, assignments.id), eq(assignmentSubmissions.userId, userId)),
    )
    .where(and(inArray(assignments.courseId, courseIds), eq(assignments.isPublished, true)))
    .orderBy(desc(assignments.createdAt))
    .limit(500)

  return NextResponse.json({ items: rows })
}

