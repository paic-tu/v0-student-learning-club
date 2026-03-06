import { type NextRequest, NextResponse } from "next/server"
import { getCohortById } from "@/lib/db/queries"

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const id = params.id
    const cohort = await getCohortById(id)

    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 })
    }

    return NextResponse.json({ cohort })
  } catch (error) {
    console.error("[v0] Error in cohort API:", error)
    return NextResponse.json({ error: "Failed to fetch cohort" }, { status: 500 })
  }
}
