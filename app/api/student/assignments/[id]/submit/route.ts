import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { assignmentSubmissions, assignments, courses, enrollments, orderItems, orders } from "@/lib/db/schema"
import { and, count, eq, inArray } from "drizzle-orm"
import { auth } from "@/lib/auth"

const submitSchema = z.object({
  textContent: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().int().min(1).optional().nullable(),
  mimeType: z.string().optional().nullable(),
}).superRefine((val, ctx) => {
  const hasText = Boolean(val.textContent && val.textContent.trim())
  const hasFile = Boolean(val.fileUrl && String(val.fileUrl).trim())
  if (!hasText && !hasFile) {
    ctx.addIssue({ code: "custom", message: "Submission must include text or file" })
  }
  if (hasFile) {
    if (!val.fileName) ctx.addIssue({ code: "custom", message: "fileName is required" })
    if (!val.fileSize) ctx.addIssue({ code: "custom", message: "fileSize is required" })
    if (!val.mimeType) ctx.addIssue({ code: "custom", message: "mimeType is required" })
  }
})

async function canAccessCourse(userId: string, courseId: string) {
  const enrollment = await db.query.enrollments.findFirst({
    where: and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
    columns: { id: true },
  })
  if (!enrollment) return false

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    columns: { isFree: true, price: true },
  })
  if (!course) return false
  if (course.isFree) return true

  const priceNumber = Number.parseFloat(String(course.price))
  const isPaidCourse = Number.isFinite(priceNumber) && priceNumber > 0
  if (!isPaidCourse) return true

  const rows = await db
    .select({ c: count() })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.userId, userId), inArray(orders.status, ["paid", "shipped", "delivered"]), eq(orderItems.courseId, courseId)))

  return (rows[0]?.c ?? 0) > 0
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { id } = await props.params

  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, id),
    columns: { id: true, courseId: true, maxFileSizeBytes: true, isPublished: true },
  })
  if (!assignment || !assignment.isPublished) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const allowed = await canAccessCourse(userId, assignment.courseId)
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const json = await req.json().catch(() => null)
  const parsed = submitSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const input = parsed.data
  const hasFile = Boolean(input.fileUrl && String(input.fileUrl).trim())

  if (hasFile) {
    const size = Number(input.fileSize || 0)
    if (size > assignment.maxFileSizeBytes) {
      return NextResponse.json({ error: "File too large" }, { status: 413 })
    }
    const okUrl = String(input.fileUrl).startsWith("/uploads/") || String(input.fileUrl).startsWith("/api/files/")
    if (!okUrl) return NextResponse.json({ error: "Invalid file url" }, { status: 400 })
  }

  const now = new Date()
  const existing = await db.query.assignmentSubmissions.findFirst({
    where: and(eq(assignmentSubmissions.assignmentId, id), eq(assignmentSubmissions.userId, userId)),
    columns: { id: true },
  })

  if (existing) {
    const updateData: any = {
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    }

    if (input.textContent !== undefined) updateData.textContent = input.textContent?.trim() || null
    if (hasFile) {
      updateData.fileUrl = input.fileUrl
      updateData.fileName = input.fileName
      updateData.fileSize = input.fileSize
      updateData.mimeType = input.mimeType
    }

    await db
      .update(assignmentSubmissions)
      .set(updateData)
      .where(eq(assignmentSubmissions.id, existing.id))
    return NextResponse.json({ success: true, updated: true })
  }

  await db.insert(assignmentSubmissions).values({
    assignmentId: id,
    userId,
    textContent: input.textContent?.trim() || null,
    fileUrl: hasFile ? input.fileUrl : null,
    fileName: hasFile ? input.fileName : null,
    fileSize: hasFile ? input.fileSize : null,
    mimeType: hasFile ? input.mimeType : null,
    status: "submitted",
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ success: true })
}
