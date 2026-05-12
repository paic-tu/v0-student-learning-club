import { NextRequest, NextResponse } from "next/server"
// @ts-ignore
import busboy from "busboy"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { files } from "@/lib/db/schema"

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    // Allow unauthenticated uploads for public forms (like IBM submission)
    // We still keep the session info if available for tracking/ownership
    const userId = session?.user?.id;

    const contentType = request.headers.get("content-type")
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    const { fileData, fileName, fileType } = await new Promise<{
      fileData: Buffer
      fileName: string
      fileType: string
    }>((resolve, reject) => {
      const bb = busboy({ headers: { "content-type": contentType } })
      let fileReceived = false
      let fileData: Buffer
      let fileName: string
      let fileType: string

      bb.on("file", (_name: string, file: NodeJS.ReadableStream, info: { filename: string; encoding: string; mimeType: string }) => {
        fileReceived = true
        const safeBase = String(decodeURIComponent(info.filename) || "upload")
          .replace(/[\\\/]/g, "_")
          .replace(/[^\w.\-() ]+/g, "_")
        
        fileName = safeBase
        fileType = info.mimeType
        
        const chunks: any[] = []
        file.on("data", (data) => {
          chunks.push(data)
        })
        file.on("end", () => {
          fileData = Buffer.concat(chunks)
        })
      })

      bb.on("finish", () => {
        if (!fileReceived) {
          reject(new Error("No file uploaded"))
        } else {
          resolve({ fileData, fileName, fileType })
        }
      })

      bb.on("error", (err: Error) => {
        reject(err)
      })

      request.arrayBuffer().then((ab) => {
        bb.end(Buffer.from(ab) as any)
      })
    })

    const base64Content = fileData.toString("base64")

    const [insertedFile] = await db.insert(files).values({
      name: fileName,
      type: fileType,
      data: base64Content,
      size: fileData.length,
    }).returning({ id: files.id })

    const fileId = insertedFile.id

    return NextResponse.json({
      url: `/api/files/${fileId}`,
      id: fileId,
      name: fileName
    })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
  }
}
