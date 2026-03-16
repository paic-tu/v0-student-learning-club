import { db } from "@/lib/db"
import { fileChunks, files } from "@/lib/db/schema"
import { and, eq, inArray } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const { id } = params
    
    // Find file in database
    const result = await db
      .select({
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

    const file = result[0]

    if (!file) {
      return new NextResponse("File not found", { status: 404 })
    }

    const fileSize = Number(file.size || 0)
    const range = req.headers.get("range")

    if (file.storage === "chunked") {
      if (!file.isComplete || !file.chunkSize || !file.chunkCount) {
        return new NextResponse("File not ready", { status: 404 })
      }

      const chunkSize = Number(file.chunkSize)
      const chunkCount = Number(file.chunkCount)

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
      for (const r of rows) byIndex.set(Number(r.chunkIndex), { data: r.data, size: Number(r.size) })

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
          },
        })
      }

      return new NextResponse(fileChunk, {
        headers: {
          "Content-Type": file.type,
          "Content-Length": fileChunk.length.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
          "Accept-Ranges": "bytes",
        },
      })
    }

    const buffer = Buffer.from(file.data || "", "base64")
    
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
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
