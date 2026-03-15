import { NextRequest, NextResponse } from "next/server"
import Busboy from "busboy"
import { createWriteStream, promises as fs } from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { Readable } from "stream"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    const MAX_BYTES = 500 * 1024 * 1024
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await fs.mkdir(uploadsDir, { recursive: true })

    const body = request.body
    if (!body) return NextResponse.json({ error: "Missing request body" }, { status: 400 })

    const bb = Busboy({
      headers: { "content-type": contentType },
      limits: { files: 1, fileSize: MAX_BYTES },
    })

    const result = await new Promise<{ url: string; name: string; size: number; type: string }>((resolve, reject) => {
      let done = false
      let outPath = ""
      let outName = ""
      let outType = ""
      let size = 0
      let fileReceived = false

      bb.on("file", (_name, file, info) => {
        fileReceived = true
        const safeBase = String(info.filename || "upload")
          .replace(/[\\\/]/g, "_")
          .replace(/[^\w.\-() ]+/g, "_")
          .slice(0, 120)
          .trim() || "upload"
        const ext = path.extname(safeBase)
        const base = safeBase.slice(0, safeBase.length - ext.length) || "upload"
        const fileId = randomUUID()
        outName = `${base}_${fileId}${ext}`
        outType = String(info.mimeType || "application/octet-stream")
        outPath = path.join(uploadsDir, outName)

        const ws = createWriteStream(outPath)

        file.on("data", (chunk: Buffer) => {
          size += chunk.length
        })

        file.on("limit", () => {
          ws.destroy()
          file.unpipe(ws)
          fs.unlink(outPath).catch(() => {})
          if (!done) {
            done = true
            reject({ status: 413, message: "File too large (max 500MB)" })
          }
        })

        ws.on("error", (err) => {
          fs.unlink(outPath).catch(() => {})
          if (!done) {
            done = true
            reject(err)
          }
        })

        ws.on("close", () => {})

        file.pipe(ws)
      })

      bb.on("error", (err) => {
        if (!done) {
          done = true
          reject(err)
        }
      })

      bb.on("finish", () => {
        if (done) return
        if (!fileReceived || !outName || !outPath) {
          done = true
          reject({ status: 400, message: "No file provided" })
          return
        }
        done = true
        resolve({ url: `/uploads/${outName}`, name: outName, size, type: outType })
      })

      Readable.fromWeb(body as any).pipe(bb)
    })

    return NextResponse.json(result)
  } catch (error: any) {
    const status = typeof error?.status === "number" ? error.status : 500
    const message = error?.message ? String(error.message) : "Internal server error"
    return NextResponse.json({ error: message }, { status })
  }
}
