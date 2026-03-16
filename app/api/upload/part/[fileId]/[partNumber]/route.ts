import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { files } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { signUploadPartUrl } from "@/lib/storage/s3"

export const runtime = "nodejs"

export async function POST(_req: NextRequest, props: { params: Promise<{ fileId: string; partNumber: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { fileId, partNumber } = await props.params
  const part = Number.parseInt(partNumber, 10)
  if (!fileId || !Number.isFinite(part) || part < 1 || part > 10000) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 })
  }

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
  if (!file || file.storage !== "s3" || !file.storageBucket || !file.storageKey || !file.storageUploadId) {
    return NextResponse.json({ error: "Upload not initialized" }, { status: 400 })
  }

  const url = await signUploadPartUrl({
    bucket: file.storageBucket,
    key: file.storageKey,
    uploadId: file.storageUploadId,
    partNumber: part,
  })

  return NextResponse.json({ url })
}

