import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { z } from "zod"
import { db } from "@/lib/db"
import { lessons } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      orderIndex: z.number().int().min(0),
    })
  ),
})

export async function PUT(req: NextRequest) {
  try {
    await requirePermission("lessons:write")

    const body = await req.json()
    const { items } = reorderSchema.parse(body)

    // Update all items in a transaction-like manner
    // Since neon/drizzle doesn't support easy transactions in this setup, 
    // we'll run them in parallel.
    // Ideally use db.transaction() if available.
    
    await Promise.all(
      items.map((item) =>
        db
          .update(lessons)
          .set({ orderIndex: item.orderIndex })
          .where(eq(lessons.id, item.id))
      )
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Failed to reorder lessons:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message },
      { status: error.name === "ForbiddenError" ? 403 : 500 }
    )
  }
}
