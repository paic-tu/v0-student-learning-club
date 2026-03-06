import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { categories } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { z } from "zod"
import { logAudit, type AuditResource } from "@/lib/audit/audit-logger"
import { requirePermission } from "@/lib/rbac/require-permission"

const createCategorySchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  iconUrl: z.string().url().optional().or(z.literal("")).nullable(),
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
    await requirePermission("courses:write")

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
    const existing = await db.select().from(categories).where(eq(categories.slug, finalSlug)).limit(1)
    
    if (existing.length > 0) {
      finalSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    }

    const result = await db
      .insert(categories)
      .values({
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        slug: finalSlug,
        descriptionEn: data.descriptionEn || null,
        descriptionAr: data.descriptionAr || null,
        iconUrl: data.iconUrl || null,
      })
      .returning()

    const category = result[0]

    await logAudit({
      action: "create",
      resource: "category" as AuditResource,
      resourceId: category.id,
      changes: { after: category },
    })

    return NextResponse.json(category)
  } catch (error: any) {
    console.error("[v0] Failed to create category:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    await requirePermission("courses:read")

    const result = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.nameEn))

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Failed to fetch categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
