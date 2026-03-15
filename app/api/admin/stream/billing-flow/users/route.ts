import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { and, desc, eq, ilike, or } from "drizzle-orm"

const schema = z.object({
  role: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
})

export async function GET(req: NextRequest) {
  await requirePermission("store:write")

  const { searchParams } = req.nextUrl
  const parsed = schema.safeParse({
    role: searchParams.get("role") || undefined,
    search: searchParams.get("search") || undefined,
    limit: searchParams.get("limit") || undefined,
  })
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 })

  const { role, search, limit } = parsed.data
  const conditions: any[] = []
  if (role && role !== "all") conditions.push(eq(users.role, role as any))
  if (search) conditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)))

  let q = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phoneNumber: users.phoneNumber,
      phone: users.phone,
      preferences: users.preferences,
      streamConsumerId: users.streamConsumerId,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)

  if (conditions.length) q = q.where(and(...conditions))

  const rows = await q

  return NextResponse.json(rows)
}
