import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { files } from "@/lib/db/schema"

export const runtime = "nodejs"

const initSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().min(1).max(100),
  size: z.number().int().min(1),
  chunkMb: z.number().int().min(1).max(8).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = initSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  const envChunkMb = Number.parseInt(process.env.UPLOAD_CHUNK_MB || "", 10)
  const chunkMb = parsed.data.chunkMb ?? (envChunkMb > 0 ? envChunkMb : 4)
  const chunkSize = chunkMb * 1024 * 1024

  const [row] = await db
    .insert(files)
    .values({
      name: parsed.data.name,
      type: parsed.data.type,
      size: parsed.data.size,
      storage: "chunked",
      data: null,
      chunkSize,
      chunkCount: 0,
      isComplete: false,
    })
    .returning({ id: files.id })

  const id = row?.id
  if (!id) return NextResponse.json({ error: "Upload init failed" }, { status: 500 })

  return NextResponse.json({ fileId: id, url: `/api/files/${id}`, chunkSize })
}
