import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { canAccessBucket, getS3Bucket, isS3StorageEnabled } from "@/lib/storage/s3"

export const runtime = "nodejs"

export async function GET() {
  await requirePermission("settings:read")

  const enabled = isS3StorageEnabled()
  const bucket = getS3Bucket()
  const endpoint = process.env.STORAGE_ENDPOINT || ""
  const region = process.env.STORAGE_REGION || "auto"
  const forcePathStyle = process.env.STORAGE_FORCE_PATH_STYLE || ""

  if (!enabled) {
    return NextResponse.json({
      enabled: false,
      ok: false,
      error: "External storage is not configured",
      bucket,
      endpoint,
      region,
      forcePathStyle,
    })
  }

  const canAccess = bucket ? await canAccessBucket(bucket) : false

  return NextResponse.json({
    enabled: true,
    ok: canAccess,
    bucket,
    endpoint,
    region,
    forcePathStyle,
  })
}

