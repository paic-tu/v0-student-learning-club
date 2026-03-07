"use server"

import { db } from "@/lib/db"
import { categories } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { requireRole } from "@/lib/rbac/require-permission"
import { revalidatePath } from "next/cache"

const createCategorySchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
})

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
}

export async function createCategoryAction(data: z.infer<typeof createCategorySchema>) {
  try {
    // Only instructors and admins can create categories
    await requireRole("instructor", "admin")

    const parseResult = createCategorySchema.safeParse(data)

    if (!parseResult.success) {
      return { error: parseResult.error.flatten().fieldErrors }
    }

    const { nameEn, nameAr } = parseResult.data

    let baseSlug = slugify(nameEn) || slugify(nameAr)
    if (!baseSlug) baseSlug = `category-${Date.now()}`

    // Ensure slug uniqueness
    let finalSlug = baseSlug
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, finalSlug)
    })
    
    if (existing) {
      finalSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    }

    const [newCategory] = await db.insert(categories).values({
      nameEn,
      nameAr,
      slug: finalSlug,
    }).returning()

    revalidatePath("/instructor/courses")
    revalidatePath("/admin/categories")
    
    return { success: true, category: newCategory }
  } catch (error: any) {
    console.error("Create category error:", error)
    return { error: error.message || "Failed to create category" }
  }
}
