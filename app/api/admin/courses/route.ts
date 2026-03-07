import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { courses, users } from "@/lib/db/schema"
import { eq, desc, getTableColumns } from "drizzle-orm"
import { requirePermission } from "@/lib/rbac/require-permission"
import { logAudit, type AuditResource } from "@/lib/audit/audit-logger"
import { z } from "zod"

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
}

const createCourseSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  descriptionEn: z.string().min(10, "English description required"),
  descriptionAr: z.string().min(10, "Arabic description required"),
  subtitleEn: z.string().optional().or(z.literal("")),
  subtitleAr: z.string().optional().or(z.literal("")),
  language: z.string().default("ar"),
  requirements: z.array(z.string()).default([]),
  learningOutcomes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  instructorId: z.string().uuid("Valid instructor required"),
  categoryId: z.string().uuid().optional().nullable(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  duration: z.coerce.number().int().min(0).default(0),
  price: z.coerce.number().min(0).default(0),
  isFree: z.boolean().default(true),
  isPublished: z.boolean().default(false),
  thumbnailUrl: z.string().optional().or(z.literal("")).nullable(),
  videoUrl: z.string().optional().or(z.literal("")).nullable(),
})

export async function POST(req: NextRequest) {
  try {
    await requirePermission("courses:write")

    const body = await req.json()
    const parseResult = createCourseSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 400 })
    }

    const data = parseResult.data

    // Generate unique slug
    let baseSlug = slugify(data.titleEn) || slugify(data.titleAr)
    if (!baseSlug) baseSlug = `course-${Date.now()}`
    
    let finalSlug = baseSlug
    
    // Check for existing slug
    const existing = await db.select().from(courses).where(eq(courses.slug, finalSlug)).limit(1)
    
    if (existing.length > 0) {
      finalSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    }

    const result = await db
      .insert(courses)
      .values({
        titleEn: data.titleEn,
        titleAr: data.titleAr,
        subtitleEn: data.subtitleEn || null,
        subtitleAr: data.subtitleAr || null,
        descriptionEn: data.descriptionEn,
        descriptionAr: data.descriptionAr,
        language: data.language,
        requirements: data.requirements,
        learningOutcomes: data.learningOutcomes,
        tags: data.tags,
        slug: finalSlug,
        instructorId: data.instructorId,
        categoryId: data.categoryId || null,
        difficulty: data.difficulty,
        duration: data.duration,
        price: data.price.toString(), // Ensure decimal/numeric compatibility
        isFree: data.isFree,
        isPublished: data.isPublished,
        thumbnailUrl: data.thumbnailUrl || null,
        previewVideoUrl: data.videoUrl || null,
      })
      .returning()

    const course = result[0]

    await logAudit({
      action: "create",
      resource: "course" as AuditResource,
      resourceId: course.id,
      changes: { after: course },
    })

    // Return only the id field for redirect to work properly
    return NextResponse.json({ id: course.id })
  } catch (error: any) {
    console.error("[v0] Failed to create course:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    await requirePermission("courses:read")

    const limit = Math.min(Number.parseInt(req.nextUrl.searchParams.get("limit") || "50") || 50, 100)
    const offset = Number.parseInt(req.nextUrl.searchParams.get("offset") || "0") || 0

    const result = await db
      .select({
        ...getTableColumns(courses),
        instructorName: users.name,
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .orderBy(desc(courses.updatedAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Failed to fetch courses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
