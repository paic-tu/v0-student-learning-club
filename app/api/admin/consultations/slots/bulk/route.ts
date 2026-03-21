import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { consultationSlots } from "@/lib/db/schema"
import { requirePermission } from "@/lib/rbac/require-permission"

const BulkSchema = z.object({
  slots: z
    .array(
      z.object({
        expertId: z.string().min(1),
        startAt: z.string().min(1),
        endAt: z.string().min(1),
      }),
    )
    .min(1)
    .max(200),
})

export async function POST(req: NextRequest) {
  try {
    await requirePermission("consultations:write")
    const body = await req.json()
    const input = BulkSchema.parse(body)

    const values = input.slots.map((s) => {
      const startAt = new Date(s.startAt)
      const endAt = new Date(s.endAt)
      return {
        expertId: s.expertId,
        startAt,
        endAt,
        status: "available" as const,
      }
    })

    await db.insert(consultationSlots).values(values).onConflictDoNothing()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error bulk creating consultation slots:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create slots" }, { status: 500 })
  }
}

