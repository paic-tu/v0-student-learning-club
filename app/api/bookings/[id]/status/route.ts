import { type NextRequest, NextResponse } from "next/server"
import { updateBookingStatus } from "@/lib/db/queries"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"

const statusSchema = z.object({
  status: z.enum(["requested", "confirmed", "completed", "cancelled"]),
  meetingUrl: z.string().url().optional(),
})

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bookingId = params.id
    const body = await request.json()
    const validated = statusSchema.parse(body)

    const success = await updateBookingStatus(bookingId, validated.status, validated.meetingUrl)

    if (!success) {
      return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
    }

    return NextResponse.json({ message: "Booking updated successfully" })
  } catch (error: any) {
    console.error("[v0] Error updating booking:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}
