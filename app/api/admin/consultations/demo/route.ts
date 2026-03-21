import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { consultationExperts, consultationSlots } from "@/lib/db/schema"

export async function POST() {
  try {
    await requirePermission("consultations:write")

    const existing = await db.select({ id: consultationExperts.id }).from(consultationExperts).limit(1)
    if (existing.length > 0) {
      return NextResponse.json({ success: true })
    }

    const [e1, e2, e3] = await db
      .insert(consultationExperts)
      .values([
        {
          nameEn: "Aisha Alqahtani",
          nameAr: "عائشة القحطاني",
          fieldEn: "Frontend Engineering",
          fieldAr: "هندسة الواجهات",
          imageUrl: "/placeholder.svg",
          sortOrder: 1,
          isActive: true,
          updatedAt: new Date(),
        },
        {
          nameEn: "Fahad Almutairi",
          nameAr: "فهد المطيري",
          fieldEn: "Backend & Databases",
          fieldAr: "باك اند وقواعد البيانات",
          imageUrl: "/placeholder.svg",
          sortOrder: 2,
          isActive: true,
          updatedAt: new Date(),
        },
        {
          nameEn: "Sara Alharbi",
          nameAr: "سارة الحربي",
          fieldEn: "UI/UX Design",
          fieldAr: "تصميم UI/UX",
          imageUrl: "/placeholder.svg",
          sortOrder: 3,
          isActive: true,
          updatedAt: new Date(),
        },
      ])
      .returning()

    const now = new Date()
    const slots: Array<{ expertId: string; startAt: Date; endAt: Date; status: "available" }> = []
    const hours = [16, 17, 18, 19, 20]

    for (let d = 0; d < 7; d++) {
      const day = new Date(now)
      day.setDate(day.getDate() + d)
      day.setHours(0, 0, 0, 0)
      for (const e of [e1, e2, e3]) {
        for (const h of hours) {
          const startAt = new Date(day)
          startAt.setHours(h, 0, 0, 0)
          const endAt = new Date(day)
          endAt.setHours(h + 1, 0, 0, 0)
          slots.push({ expertId: e.id, startAt, endAt, status: "available" })
        }
      }
    }

    await db.insert(consultationSlots).values(slots)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error creating consultations demo:", error)
    return NextResponse.json({ error: "Failed to create demo" }, { status: 500 })
  }
}

