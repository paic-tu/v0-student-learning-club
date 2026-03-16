import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fileChunks, files } from "@/lib/db/schema"
import { and, asc, eq, gte, lte } from "drizzle-orm"
import { getS3Bucket, getS3KeyForFileId, isS3StorageEnabled, objectExists, signGetObjectUrl } from "@/lib/storage/s3"

export const runtime = "nodejs"

function safeFilename(name: string) {
  return name.replace(/[\r\n"]/g, "_").slice(0, 180) || "file"
}

function decodeBase64(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") return Buffer.from(base64, "base64")
  const bin = atob(base64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function parseRangeHeader(range: string, size: number) {
  const normalized = range.trim()
  if (!normalized.toLowerCase().startsWith("bytes=")) return null
  const first = normalized.slice(6).split(",")[0]?.trim() || ""
  const m = first.match(/^(\d*)-(\d*)$/)
  if (!m) return null
  const startRaw = m[1]
  const endRaw = m[2]

  if (startRaw === "" && endRaw === "") return null

  if (startRaw === "" && endRaw !== "") {
    const suffix = Number.parseInt(endRaw, 10)
    if (!Number.isFinite(suffix) || suffix <= 0) return null
    const start = Math.max(0, size - suffix)
    const end = size > 0 ? size - 1 : 0
    return { start, end }
  }

  const start = Number.parseInt(startRaw, 10)
  if (!Number.isFinite(start) || start < 0) return null

  if (endRaw === "") {
    const end = size > 0 ? size - 1 : 0
    return { start, end }
  }

  const end = Number.parseInt(endRaw, 10)
  if (!Number.isFinite(end) || end < 0) return null
  return { start, end: Math.min(end, Math.max(0, size - 1)) }
}

function streamBase64Range(base64: string, start: number, end: number) {
  const bytesTotal = Math.max(0, end - start + 1)
  const base64Start = Math.floor(start / 3) * 4
  const base64End = Math.ceil((end + 1) / 3) * 4
  const firstBlockByteStart = Math.floor(start / 3) * 3
  let bytesToSkip = start - firstBlockByteStart
  let remaining = bytesTotal
  let pos = base64Start
  const stepChars = 4 * 65536

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (remaining <= 0) {
        controller.close()
        return
      }

      const nextPos = Math.min(base64End, pos + stepChars)
      if (nextPos <= pos) {
        controller.close()
        return
      }

      const slice = base64.slice(pos, nextPos)
      pos = nextPos

      let buf = decodeBase64(slice)
      if (bytesToSkip > 0) {
        buf = buf.subarray(bytesToSkip)
        bytesToSkip = 0
      }

      if (buf.length > remaining) buf = buf.subarray(0, remaining)
      remaining -= buf.length
      controller.enqueue(buf)
    },
  })
}

async function getFileMeta(id: string) {
  const rows = await db
    .select({
      name: files.name,
      storage: files.storage,
      type: files.type,
      size: files.size,
      data: files.data,
      storageKey: files.storageKey,
      storageBucket: files.storageBucket,
      isComplete: files.isComplete,
      chunkSize: files.chunkSize,
      chunkCount: files.chunkCount,
    })
    .from(files)
    .where(eq(files.id, id))
    .limit(1)
  return rows[0] || null
}

async function tryRedirectToS3(fileId: string, file?: any) {
  if (!isS3StorageEnabled()) return null
  const bucket = String(file?.storageBucket || getS3Bucket())
  const key = String(file?.storageKey || getS3KeyForFileId(fileId))
  const filename = safeFilename(String(file?.name || fileId))
  const type = file?.type ? String(file.type) : undefined
  const exists = await objectExists({ bucket, key })
  if (!exists) return null
  const url = await signGetObjectUrl({ bucket, key, filename, contentType: type })
  return NextResponse.redirect(url, { status: 307 })
}

export async function HEAD(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const file = await getFileMeta(id)
    if (!file) return new NextResponse(null, { status: 404 })
    const redirect = await tryRedirectToS3(id, file)
    if (redirect) return redirect

    const fileSize = Number(file.size || 0)
    const filename = safeFilename(String(file.name || "file"))
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": file.type,
        "Content-Length": fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="${filename}"`,
        "X-File-Storage": String(file.storage),
      },
    })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const { id } = params
    
    // Find file in database
    const file = await getFileMeta(id)

    if (!file) {
      return new NextResponse("File not found", { status: 404, headers: { "Cache-Control": "no-store" } })
    }

    const redirect = await tryRedirectToS3(id, file)
    if (redirect) return redirect

    const fileSize = Number(file.size || 0)
    const range = req.headers.get("range")
    const filename = safeFilename(String(file.name || "file"))
    const rangeParsed = range && fileSize > 0 ? parseRangeHeader(range, fileSize) : null

    if (file.storage === "chunked") {
      if (!file.isComplete || !file.chunkSize || !file.chunkCount) {
        return new NextResponse("File not ready", { status: 404, headers: { "Cache-Control": "no-store" } })
      }

      const chunkSize = Number(file.chunkSize)
      const chunkCount = Number(file.chunkCount)
      if (fileSize <= 0 || !chunkSize || !chunkCount) {
        return new NextResponse("File not found", { status: 404, headers: { "Cache-Control": "no-store" } })
      }

      const start = rangeParsed ? rangeParsed.start : 0
      const end = rangeParsed ? rangeParsed.end : fileSize - 1
      if (start >= fileSize || start < 0 || end < start) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Type": file.type,
            "Cache-Control": "no-store",
          },
        })
      }

      const firstChunk = Math.floor(start / chunkSize)
      const lastChunk = Math.floor(end / chunkSize)
      if (firstChunk < 0 || lastChunk >= chunkCount) {
        return new NextResponse("File not found", { status: 404, headers: { "Cache-Control": "no-store" } })
      }

      const rows = await db
        .select({ chunkIndex: fileChunks.chunkIndex, data: fileChunks.data })
        .from(fileChunks)
        .where(and(eq(fileChunks.fileId, id), gte(fileChunks.chunkIndex, firstChunk), lte(fileChunks.chunkIndex, lastChunk)))
        .orderBy(asc(fileChunks.chunkIndex))

      const byIndex = new Map<number, string>()
      for (const r of rows) byIndex.set(Number(r.chunkIndex), String(r.data))
      for (let i = firstChunk; i <= lastChunk; i++) {
        if (!byIndex.has(i)) {
          return new NextResponse("File not ready", { status: 404, headers: { "Cache-Control": "no-store" } })
        }
      }

      let currentChunk = firstChunk
      let offsetInFirst = start - firstChunk * chunkSize
      let remaining = end - start + 1

      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          if (remaining <= 0) {
            controller.close()
            return
          }
          const data = byIndex.get(currentChunk)
          if (!data) {
            controller.error(new Error("Missing chunk"))
            return
          }

          let buf = decodeBase64(data)
          if (currentChunk === firstChunk && offsetInFirst > 0) {
            buf = buf.subarray(offsetInFirst)
            offsetInFirst = 0
          }

          if (buf.length > remaining) buf = buf.subarray(0, remaining)
          remaining -= buf.length
          currentChunk += 1
          controller.enqueue(buf)
        },
      })

      const headers: Record<string, string> = {
        "Content-Type": file.type,
        "Accept-Ranges": "bytes",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
        "Content-Length": (end - start + 1).toString(),
      }

      if (rangeParsed) {
        headers["Content-Range"] = `bytes ${start}-${end}/${fileSize}`
        return new NextResponse(stream, { status: 206, headers })
      }

      return new NextResponse(stream, { headers })
    }

    const base64 = String(file.data || "")
    const size = fileSize || Math.floor((base64.length * 3) / 4)
    
    // Handle Range requests (required for video seek/streaming)
    if (size <= 0) return new NextResponse("File not found", { status: 404, headers: { "Cache-Control": "no-store" } })
    if (rangeParsed) {
      let start = rangeParsed.start
      let end = rangeParsed.end
      if (start >= size || start < 0 || end < start) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${size}`,
            "Accept-Ranges": "bytes",
            "Content-Type": file.type,
            "Cache-Control": "no-store",
            "X-File-Storage": "inline",
          },
        })
      }
      if (end >= size) end = size - 1

      const stream = streamBase64Range(base64, start, end)
      return new NextResponse(stream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": (end - start + 1).toString(),
          "Content-Type": file.type,
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "no-store",
          "X-File-Storage": "inline",
          "X-File-Size": size.toString(),
          "X-Range-Request": range ? range : "",
          "X-Range-Applied": `bytes ${start}-${end}/${size}`,
        },
      })
    }

    // Return full file
    const stream = streamBase64Range(base64, 0, size - 1)
    return new NextResponse(stream, {
      headers: {
        "Content-Type": file.type,
        "Content-Length": size.toString(),
        "Cache-Control": "no-store",
        "Accept-Ranges": "bytes", // Announce range support
        "Content-Disposition": `inline; filename="${filename}"`,
        "X-File-Storage": "inline",
        "X-File-Size": size.toString(),
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
