import { db } from "@/lib/db"
import { fileChunks, files } from "@/lib/db/schema"
import { and, asc, eq, inArray } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

function safeFilename(name: string) {
  return name.replace(/[\r\n"]/g, "_").slice(0, 180) || "file"
}

async function getFileMeta(id: string) {
  const rows = await db
    .select({
      name: files.name,
      storage: files.storage,
      type: files.type,
      data: files.data,
      size: files.size,
      chunkSize: files.chunkSize,
      chunkCount: files.chunkCount,
      isComplete: files.isComplete,
    })
    .from(files)
    .where(eq(files.id, id))
    .limit(1)
  return rows[0] || null
}

export async function HEAD(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const file = await getFileMeta(id)
    if (!file) return new NextResponse(null, { status: 404 })
    if (file.storage === "chunked" && (!file.isComplete || !file.chunkSize || !file.chunkCount)) {
      return new NextResponse(null, { status: 404 })
    }

    const fileSize = Number(file.size || 0)
    const filename = safeFilename(String(file.name || "file"))
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": file.type,
        "Content-Length": fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${filename}"`,
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
      return new NextResponse("File not found", { status: 404 })
    }

    const fileSize = Number(file.size || 0)
    const range = req.headers.get("range")
    const filename = safeFilename(String(file.name || "file"))

    if (file.storage === "chunked") {
      if (!file.isComplete || !file.chunkSize || !file.chunkCount) {
        return new NextResponse("File not ready", { status: 404 })
      }

      const chunkSize = Number(file.chunkSize)
      const chunkCount = Number(file.chunkCount)

      if (!range) {
        const rows = await db
          .select({ data: fileChunks.data })
          .from(fileChunks)
          .where(eq(fileChunks.fileId, id))
          .orderBy(asc(fileChunks.chunkIndex))

        let i = 0
        const stream = new ReadableStream<Uint8Array>({
          pull(controller) {
            if (i >= rows.length) {
              controller.close()
              return
            }
            controller.enqueue(Buffer.from(rows[i]!.data as any, "base64"))
            i += 1
          },
        })

        return new NextResponse(stream, {
          headers: {
            "Content-Type": file.type,
            "Content-Length": fileSize.toString(),
            "Cache-Control": "public, max-age=31536000, immutable",
            "Accept-Ranges": "bytes",
            "Content-Disposition": `inline; filename="${filename}"`,
          },
        })
      }

      let start = 0
      let end = fileSize > 0 ? fileSize - 1 : 0
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-")
        start = parseInt(parts[0], 10)
        end = parts[1] ? parseInt(parts[1], 10) : end
        if (!Number.isFinite(start) || start < 0) start = 0
        if (!Number.isFinite(end) || end >= fileSize) end = fileSize - 1
      }

      const firstChunk = Math.floor(start / chunkSize)
      const lastChunk = Math.floor(end / chunkSize)
      const needed = []
      for (let i = firstChunk; i <= lastChunk; i++) {
        if (i >= 0 && i < chunkCount) needed.push(i)
      }

      const rows = needed.length
        ? await db
            .select({ chunkIndex: fileChunks.chunkIndex, data: fileChunks.data, size: fileChunks.size })
            .from(fileChunks)
            .where(and(eq(fileChunks.fileId, id), inArray(fileChunks.chunkIndex, needed)))
        : []

      const byIndex = new Map<number, { data: string; size: number }>()
      for (const r of rows) byIndex.set(Number(r.chunkIndex), { data: String(r.data), size: Number(r.size) })

      const partsBuffers: Buffer[] = []
      for (let i = firstChunk; i <= lastChunk; i++) {
        const entry = byIndex.get(i)
        if (!entry) return new NextResponse("File not found", { status: 404 })
        partsBuffers.push(Buffer.from(entry.data, "base64"))
      }

      const merged = Buffer.concat(partsBuffers)
      const offsetStart = start - firstChunk * chunkSize
      const sliceLen = end - start + 1
      const fileChunk = merged.subarray(offsetStart, offsetStart + sliceLen)

      if (range) {
        return new NextResponse(fileChunk, {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": fileChunk.length.toString(),
            "Content-Type": file.type,
            "Content-Disposition": `inline; filename="${filename}"`,
          },
        })
      }

      return new NextResponse(fileChunk, {
        headers: {
          "Content-Type": file.type,
          "Content-Length": fileChunk.length.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
          "Accept-Ranges": "bytes",
          "Content-Disposition": `inline; filename="${filename}"`,
        },
      })
    }

    const buffer = Buffer.from(String(file.data || ""), "base64")
    
    // Handle Range requests (required for video seek/streaming)
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : buffer.length - 1
      const chunksize = (end - start) + 1
      const fileChunk = buffer.subarray(start, end + 1)
      
      return new NextResponse(fileChunk, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${buffer.length}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": file.type,
          "Content-Disposition": `inline; filename="${filename}"`,
        },
      })
    }

    // Return full file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": file.type,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Accept-Ranges": "bytes", // Announce range support
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
