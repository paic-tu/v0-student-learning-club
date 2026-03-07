import { db } from "@/lib/db"
import { files } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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
        type: files.type,
        data: files.data,
      })
      .from(files)
      .where(eq(files.id, id))
      .limit(1)

    const file = result[0]

    if (!file) {
      return new NextResponse("File not found", { status: 404 })
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(file.data, "base64")
    const fileSize = buffer.length
    
    // Handle Range requests (required for video seek/streaming)
    const range = req.headers.get("range")
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunksize = (end - start) + 1
      const fileChunk = buffer.subarray(start, end + 1)
      
      return new NextResponse(fileChunk, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
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
        "Content-Length": fileSize.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Accept-Ranges": "bytes", // Announce range support
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
