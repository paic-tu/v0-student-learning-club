import { type NextRequest, NextResponse } from "next/server"
import { getMentorById } from "@/lib/db/queries"
import { parseId } from "@/lib/utils"

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const id = params.id
    const mentor = await getMentorById(id)

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 })
    }

    return NextResponse.json({ mentor })
  } catch (error) {
    console.error("[v0] Error in mentor API:", error)
    return NextResponse.json({ error: "Failed to fetch mentor" }, { status: 500 })
  }
}
