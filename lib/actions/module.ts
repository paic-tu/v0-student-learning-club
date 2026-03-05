"use server"

import { db } from "@/lib/db"
import { modules } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq, and, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const moduleSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  courseId: z.string().uuid(),
})

export async function createModule(data: z.infer<typeof moduleSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
      return { error: "Unauthorized" }
    }

    // Validate data
    const validated = moduleSchema.safeParse(data)
    if (!validated.success) {
      return { error: "Invalid data" }
    }

    // Get max order index
    const existingModules = await db.query.modules.findMany({
      where: eq(modules.courseId, data.courseId),
      orderBy: [desc(modules.orderIndex)],
      limit: 1,
    })

    const orderIndex = existingModules.length > 0 ? existingModules[0].orderIndex + 1 : 0

    await db.insert(modules).values({
      courseId: data.courseId,
      titleEn: data.titleEn,
      titleAr: data.titleAr,
      orderIndex,
    })

    revalidatePath(`/instructor/courses/${data.courseId}`)
    return { success: true }
  } catch (error) {
    console.error("Create module error:", error)
    return { error: "Failed to create module" }
  }
}

export async function updateModule(moduleId: string, data: { titleEn?: string; titleAr?: string }) {
  try {
    const session = await auth()
    if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
      return { error: "Unauthorized" }
    }

    await db.update(modules)
      .set(data)
      .where(eq(modules.id, moduleId))

    // Need to find courseId to revalidate
    const moduleRow = await db.query.modules.findFirst({
      where: eq(modules.id, moduleId),
      columns: { courseId: true }
    })

    if (moduleRow) {
      revalidatePath(`/instructor/courses/${moduleRow.courseId}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Update module error:", error)
    return { error: "Failed to update module" }
  }
}

export async function deleteModule(moduleId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
      return { error: "Unauthorized" }
    }

    // Get module to find courseId
    const moduleRow = await db.query.modules.findFirst({
      where: eq(modules.id, moduleId),
      columns: { courseId: true }
    })

    if (!moduleRow) return { error: "Module not found" }

    await db.delete(modules).where(eq(modules.id, moduleId))

    revalidatePath(`/instructor/courses/${moduleRow.courseId}`)
    return { success: true }
  } catch (error) {
    console.error("Delete module error:", error)
    return { error: "Failed to delete module" }
  }
}
