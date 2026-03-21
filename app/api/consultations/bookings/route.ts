import { NextResponse, type NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { consultationBookings, consultationExperts, consultationSlots } from "@/lib/db/schema"
import { and, desc, eq, isNull, or } from "drizzle-orm"

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (user.role !== "admin" && user.role !== "instructor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const base = db
      .select({
        id: consultationBookings.id,
        status: consultationBookings.status,
        requesterName: consultationBookings.requesterName,
        requesterEmail: consultationBookings.requesterEmail,
        requesterPhone: consultationBookings.requesterPhone,
        notes: consultationBookings.notes,
        createdAt: consultationBookings.createdAt,
        expertId: consultationExperts.id,
        expertNameEn: consultationExperts.nameEn,
        expertNameAr: consultationExperts.nameAr,
        slotStartAt: consultationSlots.startAt,
        slotEndAt: consultationSlots.endAt,
      })
      .from(consultationBookings)
      .innerJoin(consultationSlots, eq(consultationBookings.slotId, consultationSlots.id))
      .innerJoin(consultationExperts, eq(consultationBookings.expertId, consultationExperts.id))

    const rows =
      user.role === "admin"
        ? await base.orderBy(desc(consultationBookings.createdAt)).limit(300)
        : await base
            .where(or(eq(consultationBookings.assignedUserId, user.id), and(isNull(consultationBookings.assignedUserId), eq(consultationExperts.userId, user.id))))
            .orderBy(desc(consultationBookings.createdAt))
            .limit(300)

    return NextResponse.json({ bookings: rows })
  } catch (error) {
    console.error("[v0] Error fetching consultation bookings:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}
