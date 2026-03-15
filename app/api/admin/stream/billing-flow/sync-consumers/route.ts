import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { and, eq, isNull } from "drizzle-orm"
import { createStreamConsumer, normalizeSaudiPhone } from "@/lib/payments/stream"

const schema = z.object({
  role: z.string().default("student"),
  limit: z.number().int().min(1).max(200).default(50),
})

export async function POST(req: NextRequest) {
  await requirePermission("store:write")
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body || {})
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const { role, limit } = parsed.data

  const rows = await db.query.users.findMany({
    where: and(eq(users.role, role as any), isNull(users.streamConsumerId)),
    columns: { id: true, name: true, email: true, phoneNumber: true, phone: true, preferences: true },
    limit,
  })

  const results: Array<{ userId: string; ok: boolean; streamConsumerId?: string; error?: string }> = []

  for (const u of rows) {
    try {
      const phoneRaw = u.phoneNumber || u.phone || ""
      const consumer = await createStreamConsumer({
        name: u.name,
        phone_number: phoneRaw ? normalizeSaudiPhone(phoneRaw) : undefined,
        email: u.email || undefined,
        external_id: `neon_user_${u.id}`,
        communication_methods: ["WHATSAPP"],
        preferred_language: typeof u.preferences?.preferred_language === "string" ? u.preferences.preferred_language : undefined,
        alias: u.name,
        comment: "Created via Admin Billing Flow",
        iban: typeof u.preferences?.iban === "string" ? u.preferences.iban : undefined,
      })

      await db.update(users).set({ streamConsumerId: consumer.id, updatedAt: new Date() }).where(eq(users.id, u.id))
      results.push({ userId: u.id, ok: true, streamConsumerId: consumer.id })
    } catch (e) {
      results.push({ userId: u.id, ok: false, error: e instanceof Error ? e.message : "Failed" })
    }
  }

  const okCount = results.filter((r) => r.ok).length
  const failCount = results.length - okCount

  return NextResponse.json({ success: true, processed: results.length, okCount, failCount, results })
}
