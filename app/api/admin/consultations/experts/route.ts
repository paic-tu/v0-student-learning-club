import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { consultationExperts, users } from "@/lib/db/schema"
import { asc, desc, eq } from "drizzle-orm"
import { requirePermission } from "@/lib/rbac/require-permission"

const CreateExpertSchema = z.object({
  userId: z.string().uuid().optional().or(z.literal("")),
  nameEn: z.string().min(1).max(255),
  nameAr: z.string().min(1).max(255),
  fieldEn: z.string().min(1).max(255),
  fieldAr: z.string().min(1).max(255),
  imageUrl: z.string().max(2000).optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  try {
    await requirePermission("consultations:read")
    const experts = await db
      .select()
      .from(consultationExperts)
      .orderBy(asc(consultationExperts.sortOrder), desc(consultationExperts.createdAt))
    return NextResponse.json({ experts })
  } catch (error) {
    console.error("[v0] Error fetching consultation experts:", error)
    return NextResponse.json({ error: "Failed to fetch experts" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("consultations:write")
    const body = await req.json()
    const input = CreateExpertSchema.parse(body)

    if (input.userId) {
      const u = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
        columns: { id: true, role: true },
      })
      if (!u || (u.role !== "admin" && u.role !== "instructor")) {
        return NextResponse.json({ error: "Invalid user" }, { status: 400 })
      }
    }

    const [created] = await db
      .insert(consultationExperts)
      .values({
        userId: input.userId || null,
        nameEn: input.nameEn,
        nameAr: input.nameAr,
        fieldEn: input.fieldEn,
        fieldAr: input.fieldAr,
        imageUrl: input.imageUrl || null,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json({ expert: created }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating consultation expert:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create expert" }, { status: 500 })
  }
}
