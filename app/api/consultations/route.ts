import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { consultationExperts, consultationSlots } from "@/lib/db/schema"
import { and, asc, eq, gt, inArray } from "drizzle-orm"

export async function GET() {
  try {
    const now = new Date()
    const experts = await db
      .select({
        id: consultationExperts.id,
        nameEn: consultationExperts.nameEn,
        nameAr: consultationExperts.nameAr,
        fieldEn: consultationExperts.fieldEn,
        fieldAr: consultationExperts.fieldAr,
        imageUrl: consultationExperts.imageUrl,
        sortOrder: consultationExperts.sortOrder,
      })
      .from(consultationExperts)
      .where(eq(consultationExperts.isActive, true))
      .orderBy(asc(consultationExperts.sortOrder), asc(consultationExperts.createdAt))
      .limit(12)

    if (experts.length === 0) {
      return NextResponse.json({ experts: [] })
    }

    const expertIds = experts.map((e) => e.id)
    const slots = await db
      .select({
        id: consultationSlots.id,
        expertId: consultationSlots.expertId,
        startAt: consultationSlots.startAt,
        endAt: consultationSlots.endAt,
      })
      .from(consultationSlots)
      .where(and(inArray(consultationSlots.expertId, expertIds), eq(consultationSlots.status, "available"), gt(consultationSlots.startAt, now)))
      .orderBy(asc(consultationSlots.startAt))
      .limit(200)

    const byExpert = new Map<string, Array<{ id: string; startAt: string; endAt: string }>>()
    for (const s of slots) {
      const list = byExpert.get(s.expertId) || []
      if (list.length < 12) {
        list.push({ id: s.id, startAt: new Date(s.startAt).toISOString(), endAt: new Date(s.endAt).toISOString() })
        byExpert.set(s.expertId, list)
      }
    }

    return NextResponse.json({
      experts: experts.map((e) => ({
        id: e.id,
        nameEn: e.nameEn,
        nameAr: e.nameAr,
        fieldEn: e.fieldEn,
        fieldAr: e.fieldAr,
        imageUrl: e.imageUrl,
        slots: byExpert.get(e.id) || [],
      })),
    })
  } catch (error) {
    console.error("[v0] Error fetching consultations:", error)
    return NextResponse.json({ error: "Failed to fetch consultations" }, { status: 500 })
  }
}

