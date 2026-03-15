import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { assignmentSubmissions, assignments, users } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { requirePermission } from "@/lib/rbac/require-permission"

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  await requirePermission("lessons:read")
  const { id } = await props.params

  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, id),
    columns: { id: true },
  })
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 })

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
