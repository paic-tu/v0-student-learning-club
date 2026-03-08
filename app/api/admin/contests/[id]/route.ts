
import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { contests } from "@/lib/db/schema"
import { logAudit } from "@/lib/audit/audit-logger"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"

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

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await requirePermission("contests:read")

    const contest = await db.query.contests.findFirst({
      where: eq(contests.id, params.id)
    })

    if (!contest) {
      return new NextResponse("Contest not found", { status: 404 })
    }

    return NextResponse.json(contest)
  } catch (error) {
    console.error("[v0] Error fetching contest:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await requirePermission("contests:write")

    const json = await req.json()
    const body = contestSchema.parse(json)

    const [updatedContest] = await db
      .update(contests)
      .set({
        titleEn: body.titleEn,
        titleAr: body.titleAr,
        descriptionEn: body.descriptionEn,
        descriptionAr: body.descriptionAr,
        status: body.status,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        prizePool: body.prizePool,
        maxParticipants: body.maxParticipants,
      })
      .where(eq(contests.id, params.id))
      .returning()

    if (!updatedContest) {
      return new NextResponse("Contest not found", { status: 404 })
    }

    await logAudit({
      action: "update",
      resource: "contest",
      resourceId: updatedContest.id,
      changes: { title: updatedContest.titleEn, changes: body },
      userId: session.user.id,
    })

    return NextResponse.json(updatedContest)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    console.error("[v0] Error updating contest:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await requirePermission("contests:delete")

    const [deletedContest] = await db
      .delete(contests)
      .where(eq(contests.id, params.id))
      .returning()

    if (!deletedContest) {
      return new NextResponse("Contest not found", { status: 404 })
    }

    await logAudit({
      action: "delete",
      resource: "contest",
      resourceId: params.id,
      details: { title: deletedContest.titleEn },
      userId: session.user.id,
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[v0] Error deleting contest:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
