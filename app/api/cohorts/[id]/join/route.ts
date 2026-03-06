import { type NextRequest, NextResponse } from "next/server"
import { joinCohort } from "@/lib/db/queries"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cohortId = params.id
    const result = await joinCohort(user.id, cohortId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      message: result.status === "waitlist" ? "Added to waitlist" : "Successfully joined cohort",
      status: result.status,
    })
  } catch (error) {
    console.error("[v0] Error joining cohort:", error)
    return NextResponse.json({ error: "Failed to join cohort" }, { status: 500 })
  }
}
