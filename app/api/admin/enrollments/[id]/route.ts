import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { requirePermission } from "@/lib/rbac/require-permission"
import { canAccessAdmin } from "@/lib/rbac/permissions"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const user = await getCurrentUser()
    if (!user || !canAccessAdmin(user.role as any)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    await sql`DELETE FROM enrollments WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting enrollment:", error)
    return NextResponse.json({ error: "Failed to delete enrollment" }, { status: 500 })
  }
}
