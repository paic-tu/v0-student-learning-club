import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { z } from "zod"
import { db } from "@/lib/db"
import { modules } from "@/lib/db/schema"
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
    await requirePermission("courses:write") // Modules are part of courses

    const body = await req.json()
    const { items } = reorderSchema.parse(body)

    await Promise.all(
      items.map((item) =>
        db
          .update(modules)
          .set({ orderIndex: item.orderIndex })
          .where(eq(modules.id, item.id))
      )
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Failed to reorder modules:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message },
      { status: error.name === "ForbiddenError" ? 403 : 500 }
    )
  }
}
