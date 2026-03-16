import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { files } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"

const completeSchema = z.object({
  chunkCount: z.number().int().min(1),
})

export async function POST(req: NextRequest, props: { params: Promise<{ fileId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { fileId } = await props.params
  if (!fileId) return NextResponse.json({ error: "Invalid params" }, { status: 400 })

  const json = await req.json().catch(() => null)
  const parsed = completeSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  await db
    .update(files)
    .set({ chunkCount: parsed.data.chunkCount, isComplete: true })
    .where(eq(files.id, fileId))

  return NextResponse.json({ success: true, url: `/api/files/${fileId}` })
}

