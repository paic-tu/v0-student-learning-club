import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { files } from "@/lib/db/schema"
import { createMultipartUploadForFile, getRecommendedPartSizeBytes, getS3Bucket, getS3KeyForFileId, isS3StorageEnabled } from "@/lib/storage/s3"
import { eq } from "drizzle-orm"

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

  const shouldUseS3 = isS3StorageEnabled()
  const externalRequiredMb = Number.parseInt(process.env.UPLOAD_EXTERNAL_REQUIRED_MB || "", 10) > 0 ? Number.parseInt(process.env.UPLOAD_EXTERNAL_REQUIRED_MB || "", 10) : 200
  if (!shouldUseS3 && parsed.data.size > externalRequiredMb * 1024 * 1024) {
    return NextResponse.json(
      { error: `External storage required for files > ${externalRequiredMb}MB` },
      { status: 400 },
    )
  }

  const [row] = await db
    .insert(files)
    .values({
      name: parsed.data.name,
      type: parsed.data.type,
      size: parsed.data.size,
      storage: shouldUseS3 ? "s3" : "chunked",
      data: null,
      chunkSize: 0,
      chunkCount: 0,
      isComplete: false,
      ...(shouldUseS3
        ? {
            storageBucket: getS3Bucket(),
            storageKey: null,
            storageUploadId: null,
          }
        : {}),
    })
    .returning({ id: files.id })

  const id = row?.id
  if (!id) return NextResponse.json({ error: "Upload init failed" }, { status: 500 })

  if (shouldUseS3) {
    const partSize = parsed.data.chunkMb ? parsed.data.chunkMb * 1024 * 1024 : getRecommendedPartSizeBytes(parsed.data.size)
    const { uploadId } = await createMultipartUploadForFile({ fileId: id, contentType: parsed.data.type })
    const key = getS3KeyForFileId(id)

    await db
      .update(files)
      .set({ storageKey: key, storageUploadId: uploadId, chunkSize: partSize })
      .where(eq(files.id, id))

    return NextResponse.json({
      fileId: id,
      url: `/api/files/${id}`,
      chunkSize: partSize,
      uploadId,
      storage: "s3",
    })
  }

  const envChunkMb = Number.parseInt(process.env.UPLOAD_CHUNK_MB || "", 10)
  const chunkMb = parsed.data.chunkMb ?? (envChunkMb > 0 ? envChunkMb : 4)
  const chunkSize = chunkMb * 1024 * 1024

  await db
    .update(files)
    .set({ chunkSize })
    .where(eq(files.id, id))

  return NextResponse.json({ fileId: id, url: `/api/files/${id}`, chunkSize, storage: "chunked" })
}
