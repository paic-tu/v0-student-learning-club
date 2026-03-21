import { NextResponse, type NextRequest } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { and, desc, ilike, inArray, or } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    await requirePermission("consultations:write")
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get("q") || "").trim()

    const baseWhere = inArray(users.role, ["admin", "instructor"])
    const where =
      q.length > 0
        ? and(baseWhere, or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)))
        : baseWhere

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(200)

    return NextResponse.json({ users: result })
  } catch (error) {
    console.error("[v0] Error fetching eligible consultation users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

