
import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { contests } from "@/lib/db/schema"
import { logAudit } from "@/lib/audit/audit-logger"
import { z } from "zod"
import { auth } from "@/lib/auth"

const contestSchema = z.object({
  titleEn: z.string().min(1),
  titleAr: z.string().min(1),
  descriptionEn: z.string().min(10),
  descriptionAr: z.string().min(10),
  status: z.enum(["upcoming", "active", "completed"]),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  prizePool: z.string().optional(),
  maxParticipants: z.number().int().min(0).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await requirePermission("contests:write")

    const json = await req.json()
    const body = contestSchema.parse(json)

    const [contest] = await db.insert(contests).values({
      titleEn: body.titleEn,
      titleAr: body.titleAr,
      descriptionEn: body.descriptionEn,
      descriptionAr: body.descriptionAr,
      status: body.status,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
      prizePool: body.prizePool,
      maxParticipants: body.maxParticipants,
    }).returning()

    await logAudit({
      action: "create",
      resource: "contest",
      resourceId: contest.id,
      details: { title: contest.titleEn },
      userId: session.user.id,
    })

    return NextResponse.json(contest)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    console.error("[v0] Error creating contest:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
