import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { challenges } from "@/lib/db/schema"
import { requirePermission } from "@/lib/rbac/require-permission"
import { logAudit } from "@/lib/audit/audit-logger"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { z } from "zod"

const updateSchema = z.object({
  titleEn: z.string().min(1).optional(),
  titleAr: z.string().min(1).optional(),
  descriptionEn: z.string().min(1).optional(),
  descriptionAr: z.string().min(1).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  points: z.number().int().min(0).optional(),
  timeLimit: z.number().int().min(0).nullable().optional(),
  categoryId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  codingFormat: z.enum(["standard", "find_bug_python"]).optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  buggyCode: z.string().optional(),
  starterCode: z.string().optional(),
  solutionCode: z.string().optional(),
  rulesAr: z.string().optional(),
  rulesEn: z.string().optional(),
})

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  await requirePermission("challenges:write")

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 })
    }

    const existing = await db.query.challenges.findFirst({ where: eq(challenges.id, id) })
    if (!existing) return NextResponse.json({ error: "Challenge not found" }, { status: 404 })

    const data = parsed.data
    const existingTestCases = (existing.testCases || {}) as any
    const existingFormat = existingTestCases?.format === "find_bug_python" ? "find_bug_python" : "standard"
    const nextFormat = data.codingFormat || existingFormat

    const updateData: any = {}
    if (data.titleEn !== undefined) updateData.titleEn = data.titleEn
    if (data.titleAr !== undefined) updateData.titleAr = data.titleAr
    if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn
    if (data.descriptionAr !== undefined) updateData.descriptionAr = data.descriptionAr
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty
    if (data.points !== undefined) updateData.points = data.points
    if (data.timeLimit !== undefined) updateData.timeLimit = data.timeLimit
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    if (existing.type === "coding" && nextFormat === "find_bug_python") {
      const startAt = data.startAt !== undefined ? (data.startAt || null) : (existingTestCases?.startAt || null)
      const endAt = data.endAt !== undefined ? (data.endAt || null) : (existingTestCases?.endAt || null)
      const buggyCode = data.buggyCode !== undefined ? (data.buggyCode || "") : (existingTestCases?.buggyCode || "")
      const starterCode = data.starterCode !== undefined ? (data.starterCode || "") : (existingTestCases?.starterCode || "")
      const rulesAr = data.rulesAr !== undefined ? (data.rulesAr || null) : (existingTestCases?.rules?.ar || null)
      const rulesEn = data.rulesEn !== undefined ? (data.rulesEn || null) : (existingTestCases?.rules?.en || null)

      updateData.testCases = {
        format: "find_bug_python",
        language: "python",
        buggyCode,
        starterCode: starterCode || buggyCode,
        startAt,
        endAt,
        rules: { ar: rulesAr, en: rulesEn },
      }

      if (data.solutionCode !== undefined) updateData.solution = data.solutionCode || ""
    }

    const [updated] = await db.update(challenges).set(updateData).where(eq(challenges.id, id)).returning()

    await logAudit({
      action: "update",
      resource: "challenge",
      resourceId: id,
      changes: { before: existing, after: updated },
    })

    revalidatePath(`/ar/admin/challenges`)
    revalidatePath(`/en/admin/challenges`)
    revalidatePath(`/ar/admin/contests`)
    revalidatePath(`/en/admin/contests`)
    revalidatePath(`/ar/challenges`)
    revalidatePath(`/en/challenges`)
    revalidatePath(`/ar/challenges/${id}`)
    revalidatePath(`/en/challenges/${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update challenge" }, { status: 500 })
  }
}

