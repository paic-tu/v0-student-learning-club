import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { consultationExperts, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requirePermission } from "@/lib/rbac/require-permission"

const UpdateSchema = z.object({
  userId: z.string().uuid().optional().or(z.literal("")).nullable(),
  nameEn: z.string().min(1).max(255).optional(),
  nameAr: z.string().min(1).max(255).optional(),
  fieldEn: z.string().min(1).max(255).optional(),
  fieldAr: z.string().min(1).max(255).optional(),
  imageUrl: z.string().max(2000).optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  try {
    await requirePermission("consultations:write")
    const body = await req.json()
    const input = UpdateSchema.parse(body)

    if (input.userId !== undefined) {
      if (input.userId) {
        const u = await db.query.users.findFirst({
          where: eq(users.id, input.userId),
          columns: { id: true, role: true },
        })
        if (!u || (u.role !== "admin" && u.role !== "instructor")) {
          return NextResponse.json({ error: "Invalid user" }, { status: 400 })
        }
      }
    }

    const [updated] = await db
      .update(consultationExperts)
      .set({
        ...(input.userId !== undefined ? { userId: input.userId || null } : {}),
        ...(input.nameEn !== undefined ? { nameEn: input.nameEn } : {}),
        ...(input.nameAr !== undefined ? { nameAr: input.nameAr } : {}),
        ...(input.fieldEn !== undefined ? { fieldEn: input.fieldEn } : {}),
        ...(input.fieldAr !== undefined ? { fieldAr: input.fieldAr } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl || null } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        updatedAt: new Date(),
      })
      .where(eq(consultationExperts.id, id))
      .returning()

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ expert: updated })
  } catch (error: any) {
    console.error("[v0] Error updating consultation expert:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update expert" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  try {
    await requirePermission("consultations:write")
    await db.delete(consultationExperts).where(eq(consultationExperts.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting consultation expert:", error)
    return NextResponse.json({ error: "Failed to delete expert" }, { status: 500 })
  }
}
