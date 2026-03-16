import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { fileChunks, files } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

export const runtime = "nodejs"

export async function PUT(req: NextRequest, props: { params: Promise<{ fileId: string; index: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { fileId, index } = await props.params
  const chunkIndex = Number.parseInt(index, 10)
  if (!fileId || !Number.isFinite(chunkIndex) || chunkIndex < 0) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 })
  }

  const meta = await db
    .select({ chunkSize: files.chunkSize, isComplete: files.isComplete })
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1)
  const file = meta[0]
  if (!file || file.isComplete) return NextResponse.json({ error: "Invalid upload" }, { status: 400 })

  const buf = Buffer.from(await req.arrayBuffer())
  if (!buf.length) return NextResponse.json({ error: "Empty chunk" }, { status: 400 })
  if (file.chunkSize && buf.length > file.chunkSize) return NextResponse.json({ error: "Chunk too large" }, { status: 413 })

  const base64Data = buf.toString("base64")
  await db
    .insert(fileChunks)
    .values({
      fileId,
      chunkIndex,
      data: base64Data,
      size: buf.length,
    })
    .onConflictDoUpdate({
      target: [fileChunks.fileId, fileChunks.chunkIndex],
      set: { data: base64Data, size: buf.length },
    })

  return NextResponse.json({ success: true })
}
