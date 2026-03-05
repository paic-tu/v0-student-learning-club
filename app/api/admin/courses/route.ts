import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { canManageCourses } from "@/lib/rbac/permissions"
import { logAudit } from "@/lib/audit/audit-logger"
import { z } from "zod"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

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
  thumbnailUrl: z.string().url().optional().or(z.literal("")).nullable(),
  videoUrl: z.string().url().optional().or(z.literal("")).nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageCourses(user.role as any)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

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
    const existing = await sql`SELECT 1 FROM courses WHERE slug = ${finalSlug} LIMIT 1`
    if (existing.length > 0) {
      finalSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    }

    const result = await sql`
      INSERT INTO courses (
        title_en,
        title_ar,
        subtitle_en,
        subtitle_ar,
        description_en,
        description_ar,
        language,
        requirements,
        learning_outcomes,
        tags,
        slug,
        instructor_id,
        category_id,
        difficulty,
        duration,
        price,
        is_free,
        is_published,
        thumbnail_url,
        preview_video_url,
        created_at,
        updated_at
      )
      VALUES (
        ${data.titleEn},
        ${data.titleAr},
        ${data.subtitleEn || null},
        ${data.subtitleAr || null},
        ${data.descriptionEn},
        ${data.descriptionAr},
        ${data.language},
        ${JSON.stringify(data.requirements)},
        ${JSON.stringify(data.learningOutcomes)},
        ${JSON.stringify(data.tags)},
        ${finalSlug},
        ${data.instructorId},
        ${data.categoryId || null},
        ${data.difficulty},
        ${data.duration},
        ${data.price},
        ${data.isFree},
        ${data.isPublished},
        ${data.thumbnailUrl || null},
        ${data.videoUrl || null},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    const course = result[0]

    await logAudit({
      action: "create",
      resource: "course",
      resourceId: course.id,
      changes: { after: course },
    })

    // Return only the id field for redirect to work properly
    return NextResponse.json({ id: course.id })
  } catch (error) {
    console.error("[v0] Failed to create course:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageCourses(user.role as any)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const limit = Math.min(Number.parseInt(req.nextUrl.searchParams.get("limit") || "50") || 50, 100)
    const offset = Number.parseInt(req.nextUrl.searchParams.get("offset") || "0") || 0

    const courses = await sql`
      SELECT c.*, u.name as instructor_name
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      ORDER BY c.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return NextResponse.json(courses)
  } catch (error) {
    console.error("[v0] Failed to fetch courses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
