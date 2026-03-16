import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { files } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { completeMultipartUpload } from "@/lib/storage/s3"

export const runtime = "nodejs"

const completeSchema = z.object({
  chunkCount: z.number().int().min(1).optional(),
  parts: z
    .array(
      z.object({
        partNumber: z.number().int().min(1).max(10000),
        etag: z.string().min(1),
      }),
    )
    .optional(),
})

export async function POST(req: NextRequest, props: { params: Promise<{ fileId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { fileId } = await props.params
  if (!fileId) return NextResponse.json({ error: "Invalid params" }, { status: 400 })

  const json = await req.json().catch(() => null)
  const parsed = completeSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  const rows = await db
    .select({
      storage: files.storage,
      storageBucket: files.storageBucket,
      storageKey: files.storageKey,
      storageUploadId: files.storageUploadId,
    })
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1)

  const file = rows[0]
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 })

  if (file.storage === "s3") {
    const parts = parsed.data.parts
    if (!parts?.length) return NextResponse.json({ error: "Missing parts" }, { status: 400 })
    if (!file.storageBucket || !file.storageKey || !file.storageUploadId) {
      return NextResponse.json({ error: "Upload not initialized" }, { status: 400 })
    }

    await completeMultipartUpload({
      bucket: file.storageBucket,
      key: file.storageKey,
      uploadId: file.storageUploadId,
      parts,
    })

    await db
      .update(files)
      .set({ chunkCount: parts.length, isComplete: true, storageUploadId: null })
      .where(eq(files.id, fileId))

    return NextResponse.json({ success: true, url: `/api/files/${fileId}` })
  }

  const chunkCount = parsed.data.chunkCount
  if (!chunkCount) return NextResponse.json({ error: "Missing chunkCount" }, { status: 400 })

  await db.update(files).set({ chunkCount, isComplete: true }).where(eq(files.id, fileId))

  return NextResponse.json({ success: true, url: `/api/files/${fileId}` })
}
