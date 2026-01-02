import { type NextRequest, NextResponse } from "next/server"
import { getAllCohorts } from "@/lib/db/queries"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let cohorts = await getAllCohorts()

    // Filter by status if provided
    if (status) {
      cohorts = cohorts.filter((c: any) => c.status === status)
    }

    return NextResponse.json({ cohorts })
  } catch (error) {
    console.error("[v0] Error in cohorts API:", error)
    return NextResponse.json({ error: "Failed to fetch cohorts" }, { status: 500 })
  }
}
