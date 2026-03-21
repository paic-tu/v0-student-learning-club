import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { consultationSlots } from "@/lib/db/schema"
import { asc, desc, eq } from "drizzle-orm"
import { requirePermission } from "@/lib/rbac/require-permission"

const CreateSlotSchema = z.object({
  expertId: z.string().min(1),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    await requirePermission("consultations:read")
    const { searchParams } = new URL(request.url)
    const expertId = searchParams.get("expertId")

    const q = db
      .select()
      .from(consultationSlots)
      .orderBy(desc(consultationSlots.startAt), asc(consultationSlots.createdAt))
      .limit(500)

    const slots = expertId ? await q.where(eq(consultationSlots.expertId, expertId)) : await q
    return NextResponse.json({ slots })
  } catch (error) {
    console.error("[v0] Error fetching consultation slots:", error)
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("consultations:write")
    const body = await req.json()
    const input = CreateSlotSchema.parse(body)
    const startAt = new Date(input.startAt)
    const endAt = new Date(input.endAt)

    if (!(startAt instanceof Date) || Number.isNaN(startAt.getTime()) || !(endAt instanceof Date) || Number.isNaN(endAt.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 })
    }
    if (endAt <= startAt) {
      return NextResponse.json({ error: "Invalid time range" }, { status: 400 })
    }

    const [created] = await db
      .insert(consultationSlots)
      .values({
        expertId: input.expertId,
        startAt,
        endAt,
        status: "available",
      })
      .returning()

    return NextResponse.json({ slot: created }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating consultation slot:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create slot" }, { status: 500 })
  }
}

