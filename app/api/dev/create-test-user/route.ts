import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not allowed in production" }, { status: 403 })
    }

    const { email, name, role } = await request.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash("password123", 10)
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) })

    if (existing) {
      await db
        .update(users)
        .set({
          name: name || existing.name || "Test User",
          role: (role || existing.role || "student") as any,
          passwordHash,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.email, email))
    } else {
      await db.insert(users).values({
        email,
        name: name || "Test User",
        role: (role || "student") as any,
        passwordHash,
        isActive: true,
      })
    }

    return NextResponse.json({ success: true, email, password: "password123" })
  } catch (error) {
    console.error("[dev] create-test-user error:", error)
    return NextResponse.json({ error: "Failed to create test user" }, { status: 500 })
  }
}
