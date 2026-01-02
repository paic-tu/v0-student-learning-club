import { type NextRequest, NextResponse } from "next/server"
import { getAllMentors } from "@/lib/db/queries"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const skill = searchParams.get("skill")

    let mentors = await getAllMentors()

    // Filter by skill if provided
    if (skill) {
      mentors = mentors.filter((m: any) => m.skills?.includes(skill))
    }

    return NextResponse.json({ mentors })
  } catch (error) {
    console.error("[v0] Error in mentors API:", error)
    return NextResponse.json({ error: "Failed to fetch mentors" }, { status: 500 })
  }
}
