import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { consultationBookings, consultationExperts, consultationSlots } from "@/lib/db/schema"
import { and, eq, gt } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth"

const BookSchema = z.object({
  slotId: z.string().min(1),
  requesterName: z.string().min(1).max(255),
  requesterEmail: z.string().email().max(255),
  requesterPhone: z.string().max(32).optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()

    const body = await req.json()
    const { slotId, notes, requesterName, requesterEmail, requesterPhone } = BookSchema.parse(body)
    const now = new Date()

    const updatedSlots = await db
      .update(consultationSlots)
      .set({ status: "booked" })
      .where(and(eq(consultationSlots.id, slotId), eq(consultationSlots.status, "available"), gt(consultationSlots.startAt, now)))
      .returning()

    const slot = updatedSlots[0]
    if (!slot) {
      return NextResponse.json({ error: "Slot not available" }, { status: 409 })
    }

    try {
      const [expert] = await db
        .select({ userId: consultationExperts.userId })
        .from(consultationExperts)
        .where(eq(consultationExperts.id, slot.expertId))
        .limit(1)

      const [booking] = await db
        .insert(consultationBookings)
        .values({
          expertId: slot.expertId,
          assignedUserId: expert?.userId ?? null,
          slotId: slot.id,
          userId: user?.id ?? null,
          requesterName,
          requesterEmail,
          requesterPhone: requesterPhone || null,
          status: "requested",
          notes,
        })
        .returning()

      return NextResponse.json({ booking }, { status: 201 })
    } catch (e) {
      await db
        .update(consultationSlots)
        .set({ status: "available" })
        .where(eq(consultationSlots.id, slotId))
      throw e
    }
  } catch (error: any) {
    console.error("[v0] Error creating consultation booking:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to book consultation" }, { status: 500 })
  }
}
