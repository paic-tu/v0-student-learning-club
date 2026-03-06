import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { logAudit } from "@/lib/audit/audit-logger"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["student", "instructor", "admin"]).optional(),
  bio: z.string().optional(),
  points: z.number().optional(),
  level: z.number().optional(),
})

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("users:read")

    const userId = params.id
    const users = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { password_hash, ...user } = users[0]
    return NextResponse.json(user)
  } catch (error: any) {
    console.error("[v0] Error fetching user:", error)
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("users:write")

    const userId = params.id
    const body = await request.json()
    const data = updateUserSchema.parse(body)

    // Get before state
    const existing = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`
    
    if (existing.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const result = await sql`
      UPDATE users SET 
        name = COALESCE(${data.name || null}, name),
        email = COALESCE(${data.email || null}, email),
        role = COALESCE(${data.role || null}, role),
        bio = COALESCE(${data.bio || null}, bio),
        points = COALESCE(${data.points ?? null}, points),
        level = COALESCE(${data.level ?? null}, level),
        updated_at = NOW()
      WHERE id = ${userId} 
      RETURNING *
    `

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    // Log audit
    await logAudit({
      action: "update",
      resource: "user",
      resourceId: userId,
      changes: {
        before: existing[0],
        after: result[0],
      },
    })

    const { password_hash, ...user } = result[0]
    return NextResponse.json(user)
  } catch (error: any) {
    console.error("[v0] Error updating user:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}
