import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { categories, courses } from "@/lib/db/schema"
import { eq, and, ne } from "drizzle-orm"
import { requirePermission } from "@/lib/rbac/require-permission"
import { z } from "zod"
import { logAudit, type AuditResource } from "@/lib/audit/audit-logger"

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
    await requirePermission("courses:read")

    const categoryId = params.id
    const category = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1)

    if (category.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(category[0])
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
    const parseResult = updateCategorySchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 400 })
    }

    const data = parseResult.data
    const existing = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1)
    
    if (existing.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== existing[0].slug) {
      const slugCheck = await db
        .select()
        .from(categories)
        .where(and(eq(categories.slug, data.slug), ne(categories.id, categoryId)))
        .limit(1)
      
      if (slugCheck.length > 0) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
      }
    }

    const updateData: any = {}
    if (data.nameEn !== undefined) updateData.nameEn = data.nameEn
    if (data.nameAr !== undefined) updateData.nameAr = data.nameAr
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn
    if (data.descriptionAr !== undefined) updateData.descriptionAr = data.descriptionAr
    // iconUrl not in previous schema insert, but present in update schema. 
    // Assuming schema has it or Drizzle will ignore/error. 
    // Previous code had: icon_url = COALESCE(${data.iconUrl || null}, icon_url)
    // I'll add it if defined.
    if (data.iconUrl !== undefined) updateData.iconUrl = data.iconUrl

    const result = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, categoryId))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
    }

    await logAudit({
      action: "update",
      resource: "category" as AuditResource,
      resourceId: categoryId,
      changes: {
        before: existing[0],
        after: result[0],
      },
    })

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error("[v0] Error updating category:", error)
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("courses:delete")

    const categoryId = params.id
    
    // Check if category is used
    const usage = await db.select({ id: courses.id }).from(courses).where(eq(courses.categoryId, categoryId)).limit(1)
    
    if (usage.length > 0) {
      return NextResponse.json({ error: "Cannot delete category with associated courses" }, { status: 409 })
    }

    const existing = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1)
    
    if (existing.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    await db.delete(categories).where(eq(categories.id, categoryId))

    await logAudit({
      action: "delete",
      resource: "category" as AuditResource,
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

