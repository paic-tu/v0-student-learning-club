import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { logAudit } from "@/lib/audit/audit-logger"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

const updateCategorySchema = z.object({
  nameEn: z.string().min(1).optional(),
  nameAr: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  iconUrl: z.string().optional(),
})

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    // Categories are public read, but this is an admin route, so maybe restrict?
    // Actually, usually admin API is protected. Public API might be different.
    // But let's require at least some permission or just be open if it's for public consumption?
    // Given it's under /api/admin, we should protect it.
    await requirePermission("courses:write") // Using courses:write as proxy for category management

    const categoryId = params.id
    const categories = await sql`SELECT * FROM categories WHERE id = ${categoryId} LIMIT 1`

    if (categories.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(categories[0])
  } catch (error: any) {
    console.error("[v0] Error fetching category:", error)
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("courses:write")

    const categoryId = params.id
    const body = await request.json()
    const data = updateCategorySchema.parse(body)

    const existing = await sql`SELECT * FROM categories WHERE id = ${categoryId} LIMIT 1`
    
    if (existing.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== existing[0].slug) {
      const slugCheck = await sql`SELECT 1 FROM categories WHERE slug = ${data.slug} AND id != ${categoryId} LIMIT 1`
      if (slugCheck.length > 0) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
      }
    }

    const result = await sql`
      UPDATE categories SET 
        name_en = COALESCE(${data.nameEn || null}, name_en),
        name_ar = COALESCE(${data.nameAr || null}, name_ar),
        slug = COALESCE(${data.slug || null}, slug),
        description_en = COALESCE(${data.descriptionEn || null}, description_en),
        description_ar = COALESCE(${data.descriptionAr || null}, description_ar),
        icon_url = COALESCE(${data.iconUrl || null}, icon_url)
      WHERE id = ${categoryId} 
      RETURNING *
    `

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
    }

    await logAudit({
      action: "update",
      resource: "category",
      resourceId: categoryId,
      changes: {
        before: existing[0],
        after: result[0],
      },
    })

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("[v0] Error updating category:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("courses:write")

    const categoryId = params.id
    
    const existing = await sql`SELECT * FROM categories WHERE id = ${categoryId} LIMIT 1`
    if (existing.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Check if category is used
    const usage = await sql`SELECT 1 FROM courses WHERE category_id = ${categoryId} LIMIT 1`
    if (usage.length > 0) {
      return NextResponse.json({ error: "Cannot delete category with associated courses" }, { status: 409 })
    }

    await sql`DELETE FROM categories WHERE id = ${categoryId}`

    await logAudit({
      action: "delete",
      resource: "category",
      resourceId: categoryId,
      changes: {
        before: existing[0],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting category:", error)
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}
