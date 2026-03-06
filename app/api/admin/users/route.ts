import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { logAudit } from "@/lib/audit/audit-logger"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["student", "instructor", "admin", "manager"]).default("student"),
})

export async function POST(request: NextRequest) {
  try {
    await requirePermission("users:write")

    const body = await request.json()
    const parseResult = createUserSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 400 })
    }

    const data = parseResult.data

    // Check if user exists
    const existing = await sql`SELECT 1 FROM users WHERE email = ${data.email} LIMIT 1`
    if (existing.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Insert user
    // Note: We cast role to text to rely on implicit cast to enum if needed, or just pass as string
    const result = await sql`
      INSERT INTO users (
        name, 
        email, 
        password_hash, 
        role, 
        email_verified, 
        created_at, 
        updated_at
      )
      VALUES (
        ${data.name}, 
        ${data.email}, 
        ${hashedPassword}, 
        ${data.role}, 
        NOW(), 
        NOW(), 
        NOW()
      )
      RETURNING *
    `

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Log audit
    await logAudit({
      action: "create",
      resource: "user",
      resourceId: result[0].id,
      changes: {
        after: result[0],
      },
    })

    const { password_hash, ...user } = result[0]
    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating user:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await requirePermission("users:read")

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const search = searchParams.get("search")

    // Basic query with optional filters
    // Note: neon template literal doesn't support dynamic WHERE clauses easily.
    // We'll use a simple approach or fetch all (limit 100) and filter if needed, 
    // but for search we should try to use SQL.
    
    let users
    if (search && role) {
      users = await sql`
        SELECT id, name, email, role, avatar_url, created_at 
        FROM users 
        WHERE role = ${role} 
          AND (name ILIKE ${`%${search}%`} OR email ILIKE ${`%${search}%`})
        ORDER BY created_at DESC 
        LIMIT 100
      `
    } else if (role) {
      users = await sql`
        SELECT id, name, email, role, avatar_url, created_at 
        FROM users 
        WHERE role = ${role}
        ORDER BY created_at DESC 
        LIMIT 100
      `
    } else if (search) {
      users = await sql`
        SELECT id, name, email, role, avatar_url, created_at 
        FROM users 
        WHERE name ILIKE ${`%${search}%`} OR email ILIKE ${`%${search}%`}
        ORDER BY created_at DESC 
        LIMIT 100
      `
    } else {
      users = await sql`
        SELECT id, name, email, role, avatar_url, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 100
      `
    }

    return NextResponse.json(users)
  } catch (error: any) {
    console.error("[v0] Error fetching users:", error)
    return NextResponse.json({ error: error.message }, { status: error.name === "ForbiddenError" ? 403 : 500 })
  }
}
