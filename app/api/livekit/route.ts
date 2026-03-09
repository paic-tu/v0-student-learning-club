import { AccessToken } from "livekit-server-sdk"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getEnrollment, getCourseById } from "@/lib/db/queries"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const room = req.nextUrl.searchParams.get("room")
  const username = req.nextUrl.searchParams.get("username")

  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 })
  }

  const courseId = room.startsWith("course-") ? room.replace("course-", "") : ""
  if (!courseId) {
    return NextResponse.json({ error: "Invalid room" }, { status: 400 })
  }

  const course = await getCourseById(courseId)
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (!course.isLive) {
    return NextResponse.json({ error: "Not live" }, { status: 403 })
  }

  const role = (session.user as any).role || "student"
  if (role === "student") {
    const enrollment = await getEnrollment(session.user.id, courseId)
    if (!enrollment) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  } else if (role === "instructor") {
    if (course.instructorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  } else if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const identity = username || session.user.name || session.user.id
  const at = new AccessToken(apiKey, apiSecret, { identity })

  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: role === "instructor" || role === "admin",
  } as any)

  return NextResponse.json({ token: await at.toJwt() })
}
