import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { consultationSlots } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requirePermission } from "@/lib/rbac/require-permission"

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  try {
    await requirePermission("consultations:write")
    await db.delete(consultationSlots).where(eq(consultationSlots.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting consultation slot:", error)
    return NextResponse.json({ error: "Failed to delete slot" }, { status: 500 })
  }
}

