import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await requirePermission("store:write")
  const { id } = await props.params

  const u = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      phoneNumber: true,
      phone: true,
      preferences: true,
      streamConsumerId: true,
      createdAt: true,
    },
  })

  if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json(u)
}

