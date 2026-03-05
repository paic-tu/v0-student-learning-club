import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"

const sql = neon(process.env.DATABASE_URL!)

const createCategorySchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
})

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    // Allow admins and instructors to create categories for course authoring
    if (!user || (user.role !== "admin" && user.role !== "instructor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const parseResult = createCategorySchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 400 })
    }

    const data = parseResult.data
    let baseSlug = slugify(data.nameEn) || slugify(data.nameAr)
    if (!baseSlug) baseSlug = `category-${Date.now()}`

    // Ensure slug uniqueness
    let finalSlug = baseSlug
    const existing = await sql`SELECT 1 FROM categories WHERE slug = ${finalSlug} LIMIT 1`
    if (existing.length > 0) {
      finalSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    }

    const result = await sql`
      INSERT INTO categories (
        name_en,
        name_ar,
        slug,
        description_en,
        description_ar
      )
      VALUES (
        ${data.nameEn},
        ${data.nameAr},
        ${finalSlug},
        ${data.descriptionEn || null},
        ${data.descriptionAr || null}
      )
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Failed to create category:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const categories = await sql`
      SELECT * FROM categories
      ORDER BY name_en ASC
    `
    return NextResponse.json(categories)
  } catch (error) {
    console.error("[v0] Failed to fetch categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
