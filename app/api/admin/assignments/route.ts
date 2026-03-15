import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { assignments, courses } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { requirePermission } from "@/lib/rbac/require-permission"

const createSchema = z.object({
  courseId: z.string().uuid(),
  titleEn: z.string().min(1).max(255),
  titleAr: z.string().min(1).max(255),
  descriptionEn: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  isPublished: z.boolean().optional(),
})

export async function GET() {
  await requirePermission("lessons:read")

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
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .orderBy(desc(assignments.createdAt))
    .limit(200)

  return NextResponse.json({ items: rows })
}

export async function POST(req: NextRequest) {
  const user = await requirePermission("lessons:write")

  const json = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const input = parsed.data
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, input.courseId),
    columns: { id: true },
  })
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

  const [row] = await db
    .insert(assignments)
    .values({
      courseId: input.courseId,
      titleEn: input.titleEn,
      titleAr: input.titleAr,
      descriptionEn: input.descriptionEn ?? null,
      descriptionAr: input.descriptionAr ?? null,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      isPublished: input.isPublished ?? true,
      createdById: user.id,
    })
    .returning({ id: assignments.id })

  return NextResponse.json({ success: true, id: row.id })
}

