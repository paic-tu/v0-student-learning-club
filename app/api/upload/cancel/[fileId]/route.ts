import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { files } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { abortMultipartUpload } from "@/lib/storage/s3"

export const runtime = "nodejs"

export async function DELETE(_req: NextRequest, props: { params: Promise<{ fileId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { fileId } = await props.params
  if (!fileId) return NextResponse.json({ error: "Invalid params" }, { status: 400 })

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

  if (file?.storage === "s3" && file.storageBucket && file.storageKey && file.storageUploadId) {
    await abortMultipartUpload({
      bucket: file.storageBucket,
      key: file.storageKey,
      uploadId: file.storageUploadId,
    }).catch(() => {})
  }

  await db.delete(files).where(eq(files.id, fileId))
  return NextResponse.json({ success: true })
}
