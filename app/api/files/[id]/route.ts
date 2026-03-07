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

    // Return file with correct headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": file.type,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
