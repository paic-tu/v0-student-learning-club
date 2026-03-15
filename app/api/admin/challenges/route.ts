import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { challenges } from "@/lib/db/schema"
import { requirePermission } from "@/lib/rbac/require-permission"
import { logAudit } from "@/lib/audit/audit-logger"
import { revalidatePath } from "next/cache"
import * as z from "zod"

const bodySchema = z.object({
  titleEn: z.string().min(1),
  titleAr: z.string().min(1),
  descriptionEn: z.string().min(1),
  descriptionAr: z.string().min(1),
  type: z.enum(["coding", "project", "quiz"]),
  codingFormat: z.enum(["standard", "find_bug_python"]).optional(),
  buggyCode: z.string().optional(),
  starterCode: z.string().optional(),
  solutionCode: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  points: z.number().int().min(0),
  timeLimit: z.number().int().min(0).nullable().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  rulesAr: z.string().optional(),
  rulesEn: z.string().optional(),
  categoryId: z.string().min(1),
  isActive: z.boolean().optional(),
})

export async function POST(request: Request) {
  const user = await requirePermission("challenges:write")
  try {
    const json = await request.json()
    const data = bodySchema.parse(json)

    const isFindBug = data.type === "coding" && data.codingFormat === "find_bug_python"

    const testCases = isFindBug
      ? {
          format: "find_bug_python",
          language: "python",
          buggyCode: data.buggyCode || "",
          starterCode: data.starterCode || data.buggyCode || "",
          startAt: data.startAt || null,
          endAt: data.endAt || null,
          rules: {
            ar: data.rulesAr || null,
            en: data.rulesEn || null,
          },
        }
      : null

    const [created] = await db
      .insert(challenges)
      .values({
        titleEn: data.titleEn,
        titleAr: data.titleAr,
        descriptionEn: data.descriptionEn,
        descriptionAr: data.descriptionAr,
        type: data.type,
        difficulty: data.difficulty,
        points: data.points,
        timeLimit: data.timeLimit ?? null,
        categoryId: data.categoryId,
        isActive: data.isActive ?? true,
        testCases,
        solution: isFindBug ? data.solutionCode || "" : null,
      })
      .returning({ id: challenges.id })

    await logAudit({
      action: "create",
      resource: "challenge",
      resourceId: created?.id,
      userId: user.id,
      changes: { after: { type: data.type, codingFormat: data.codingFormat, titleEn: data.titleEn } },
    })

    if (created?.id) {
      revalidatePath(`/ar/challenges/${created.id}`)
      revalidatePath(`/en/challenges/${created.id}`)
    }
    revalidatePath(`/ar/challenges`)
    revalidatePath(`/en/challenges`)
    revalidatePath(`/ar/admin/challenges`)
    revalidatePath(`/en/admin/challenges`)
    revalidatePath(`/ar/admin/contests`)
    revalidatePath(`/en/admin/contests`)

    return NextResponse.json({ success: true, id: created?.id })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create challenge" }, { status: 400 })
  }
}
