import { type NextRequest, NextResponse } from "next/server"
import { createBooking, getUserBookings } from "@/lib/db/queries"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"

const bookingSchema = z.object({
  mentorId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  topic: z.string().min(1).max(255),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = (searchParams.get("role") as "student" | "mentor") || "student"

    const bookings = await getUserBookings(user.id, role)

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("[v0] Error fetching bookings:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = bookingSchema.parse(body)

    const booking = await createBooking(
      validated.mentorId,
      user.id,
      new Date(validated.startAt),
      new Date(validated.endAt),
      validated.topic,
      validated.notes,
    )

    if (!booking) {
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating booking:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}
