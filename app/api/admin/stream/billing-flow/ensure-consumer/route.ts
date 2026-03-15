import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createStreamConsumer, findStreamConsumerByPhone, normalizeSaudiPhone } from "@/lib/payments/stream"

const schema = z.object({
  userId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  await requirePermission("store:write")
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const u = await db.query.users.findFirst({
    where: eq(users.id, parsed.data.userId),
    columns: { id: true, name: true, email: true, phoneNumber: true, phone: true, streamConsumerId: true, preferences: true },
  })
  if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (u.streamConsumerId) {
    return NextResponse.json({ success: true, streamConsumerId: u.streamConsumerId })
  }

  try {
    const phoneRaw = u.phoneNumber || u.phone || ""
    const phoneE164 = phoneRaw ? normalizeSaudiPhone(phoneRaw) : ""
    const consumer = await createStreamConsumer({
      name: u.name,
      phone_number: phoneE164 || undefined,
      email: u.email || undefined,
      external_id: `neon_user_${u.id}`,
      communication_methods: ["WHATSAPP"],
      preferred_language: typeof u.preferences?.preferred_language === "string" ? u.preferences.preferred_language : undefined,
      alias: u.name,
      comment: "Created via Admin Billing Flow",
      iban: typeof u.preferences?.iban === "string" ? u.preferences.iban : undefined,
    })

    await db.update(users).set({ streamConsumerId: consumer.id, updatedAt: new Date() }).where(eq(users.id, u.id))

    return NextResponse.json({ success: true, streamConsumerId: consumer.id, consumer })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create consumer"
    const isDuplicate = msg.includes("DUPLICATE_CONSUMER") || msg.includes("Consumer already exist")
    if (isDuplicate) {
      try {
        const phoneRaw = u.phoneNumber || u.phone || ""
        const phoneE164 = phoneRaw ? normalizeSaudiPhone(phoneRaw) : ""
        const existing = phoneE164 ? await findStreamConsumerByPhone(phoneE164) : null
        const existingId = existing?.id
        if (existingId) {
          await db.update(users).set({ streamConsumerId: existingId, updatedAt: new Date() }).where(eq(users.id, u.id))
          return NextResponse.json({ success: true, streamConsumerId: existingId, consumer: existing, resolved: "duplicate_by_phone" })
        }
      } catch {}
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create consumer" }, { status: 500 })
  }
}
