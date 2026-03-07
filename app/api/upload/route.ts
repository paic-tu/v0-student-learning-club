import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { files } from "@/lib/db/schema"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString("base64")

    // Insert into database
    const [insertedFile] = await db.insert(files).values({
      name: file.name,
      type: file.type,
      data: base64Data,
      size: file.size,
    }).returning({ id: files.id })

    // Return API route URL
    const url = `/api/files/${insertedFile.id}`

    return NextResponse.json({ url })
  } catch (error: any) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}
