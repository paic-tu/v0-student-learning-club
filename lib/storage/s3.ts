import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, GetObjectCommand, HeadObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export function isS3StorageEnabled() {
  return Boolean(process.env.STORAGE_BUCKET && process.env.STORAGE_ACCESS_KEY && process.env.STORAGE_SECRET_KEY)
}

export function getS3Bucket() {
  return process.env.STORAGE_BUCKET || ""
}

export function getS3KeyForFileId(fileId: string) {
  return `uploads/${fileId}`
}

function getS3Client() {
  const endpoint = process.env.STORAGE_ENDPOINT
  const region = process.env.STORAGE_REGION || "auto"
  const accessKeyId = process.env.STORAGE_ACCESS_KEY || ""
  const secretAccessKey = process.env.STORAGE_SECRET_KEY || ""
  const forcePathStyleRaw = (process.env.STORAGE_FORCE_PATH_STYLE || "").toLowerCase().trim()
  const forcePathStyle = forcePathStyleRaw === "1" || forcePathStyleRaw === "true" || forcePathStyleRaw === "yes"

  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
  })
}

function choosePartSizeBytes(sizeBytes: number) {
  const min = 5 * 1024 * 1024
  const maxParts = 9000
  const minSize = Math.ceil(sizeBytes / maxParts)
  const roundedMb = Math.ceil(Math.max(min, minSize) / (1024 * 1024))
  return Math.min(512, Math.max(5, roundedMb)) * 1024 * 1024
}

export async function createMultipartUploadForFile({
  fileId,
  contentType,
}: {
  fileId: string
  contentType: string
}) {
  const client = getS3Client()
  const bucket = getS3Bucket()
  const key = getS3KeyForFileId(fileId)

  const res = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || "application/octet-stream",
    }),
  )

  const uploadId = res.UploadId
  if (!uploadId) throw new Error("Multipart init failed")

  return { uploadId, bucket, key }
}

export async function signUploadPartUrl({
  bucket,
  key,
  uploadId,
  partNumber,
}: {
  bucket: string
  key: string
  uploadId: string
  partNumber: number
}) {
  const client = getS3Client()
  const cmd = new UploadPartCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  })
  return getSignedUrl(client, cmd, { expiresIn: 60 * 15 })
}

export async function completeMultipartUpload({
  bucket,
  key,
  uploadId,
  parts,
}: {
  bucket: string
  key: string
  uploadId: string
  parts: { partNumber: number; etag: string }[]
}) {
  const client = getS3Client()
  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
      },
    }),
  )
}

export async function abortMultipartUpload({
  bucket,
  key,
  uploadId,
}: {
  bucket: string
  key: string
  uploadId: string
}) {
  const client = getS3Client()
  await client.send(
    new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    }),
  )
}

export async function objectExists({ bucket, key }: { bucket: string; key: string }) {
  const client = getS3Client()
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch {
    return false
  }
}

export async function canAccessBucket(bucket: string) {
  const client = getS3Client()
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }))
    return true
  } catch {
    return false
  }
}

export async function signGetObjectUrl({
  bucket,
  key,
  filename,
  contentType,
}: {
  bucket: string
  key: string
  filename: string
  contentType?: string
}) {
  const client = getS3Client()
  const original = filename.replace(/[\r\n"]/g, "_").slice(0, 180) || "file"
  const ascii = original.replace(/[^\x20-\x7E]+/g, "_").replace(/[\\"]/g, "_").trim() || "file"
  const disposition = `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(original)}`
  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: disposition,
    ...(contentType ? { ResponseContentType: contentType } : {}),
  })
  const ttlRaw = Number.parseInt(process.env.STORAGE_SIGNED_URL_TTL_SECONDS || "", 10)
  const ttl = Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : 60 * 60
  const expiresIn = Math.min(60 * 60 * 24, Math.max(60, ttl))
  return getSignedUrl(client, cmd, { expiresIn })
}

export function getRecommendedPartSizeBytes(sizeBytes: number) {
  return choosePartSizeBytes(sizeBytes)
}
