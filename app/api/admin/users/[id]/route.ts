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

    const userId = Number.parseInt(params.id)
    const users = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { password_hash: _, ...user } = users[0] as any
    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("users:write")

    const userId = Number.parseInt(params.id)
    const body = await request.json()
    const data = updateUserSchema.parse(body)

    // Get before state
    const beforeState = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`

    let query = `UPDATE users SET `
    const setClauses = []
    const values: any[] = []

    if (data.name !== undefined) {
      setClauses.push(`name = $${values.length + 1}`)
      values.push(data.name)
    }
    if (data.email !== undefined) {
      setClauses.push(`email = $${values.length + 1}`)
      values.push(data.email)
    }
    if (data.role !== undefined) {
      setClauses.push(`role = $${values.length + 1}::role`)
      values.push(data.role)
    }
    if (data.bio !== undefined) {
      setClauses.push(`bio = $${values.length + 1}`)
      values.push(data.bio)
    }
    if (data.points !== undefined) {
      setClauses.push(`points = $${values.length + 1}`)
      values.push(data.points)
    }
    if (data.level !== undefined) {
      setClauses.push(`level = $${values.length + 1}`)
      values.push(data.level)
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    query += setClauses.join(", ") + `, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`
    values.push(userId)

    const result = await sql.query(query, values)

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    // Log audit
    await logAudit({
      action: "update",
      resource: "user",
      resourceId: userId.toString(),
      changes: {
        before: beforeState[0],
        after: result[0],
      },
    })

    const { password_hash: _, ...user } = result[0] as any
    return NextResponse.json(user)
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    await requirePermission("users:delete")

    const userId = Number.parseInt(params.id)

    // Get before state
    const beforeState = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`

    // Soft delete (you could add a deleted_at column to schema)
    await sql`DELETE FROM users WHERE id = ${userId}`

    // Log audit
    await logAudit({
      action: "delete",
      resource: "user",
      resourceId: userId.toString(),
      changes: {
        before: beforeState[0],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}
