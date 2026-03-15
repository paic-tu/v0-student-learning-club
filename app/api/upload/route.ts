import { NextRequest, NextResponse } from "next/server"
import Busboy from "busboy"
import { createWriteStream, promises as fs } from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { Readable } from "stream"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { files } from "@/lib/db/schema"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const contentType = request.headers.get("content-type") || ""
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    const storageMode = (process.env.UPLOAD_STORAGE || "db").toLowerCase()
    const MAX_BYTES = 500 * 1024 * 1024
    const DB_MAX_BYTES =
      (Number.parseInt(process.env.UPLOAD_DB_MAX_MB || "", 10) > 0 ? Number.parseInt(process.env.UPLOAD_DB_MAX_MB || "", 10) : 100) *
      1024 *
      1024
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    let useDb = storageMode === "db"
    if (storageMode === "fs") useDb = false
    if (storageMode === "auto") useDb = false

    if (!useDb) {
      try {
        await fs.mkdir(uploadsDir, { recursive: true })
      } catch (e: any) {
        const code = String(e?.code || "")
        const msg = String(e?.message || "")
        if (storageMode === "auto" && (code === "EROFS" || msg.toLowerCase().includes("read-only file system"))) {
          useDb = true
        } else {
          throw e
        }
      }
    }

    const body = request.body
    if (!body) return NextResponse.json({ error: "Missing request body" }, { status: 400 })

    const bb = Busboy({
      headers: { "content-type": contentType },
      limits: { files: 1, fileSize: useDb ? DB_MAX_BYTES : MAX_BYTES },
    })

    const result = await new Promise<{ url: string; name: string; size: number; type: string }>((resolve, reject) => {
      let done = false
      let outPath = ""
      let outName = ""
      let outType = ""
      let size = 0
      let fileReceived = false
      let chunks: Buffer[] = []

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

        const ws = useDb ? null : createWriteStream(outPath)

        file.on("data", (chunk: Buffer) => {
          size += chunk.length
          if (useDb) chunks.push(chunk)
        })

        file.on("limit", () => {
          if (ws) {
            ws.destroy()
            file.unpipe(ws)
            fs.unlink(outPath).catch(() => {})
          }
          if (!done) {
            done = true
            const maxMb = Math.max(1, Math.floor((useDb ? DB_MAX_BYTES : MAX_BYTES) / 1024 / 1024))
            reject({ status: 413, message: `File too large (max ${maxMb}MB)` })
          }
        })

        if (ws) {
          ws.on("error", (err) => {
            fs.unlink(outPath).catch(() => {})
            if (!done) {
              done = true
              reject(err)
            }
          })

          ws.on("close", () => {})

          file.pipe(ws)
        }
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
        if (useDb) {
          const buf = Buffer.concat(chunks)
          const base64Data = buf.toString("base64")
          db.insert(files)
            .values({ name: outName, type: outType, data: base64Data, size })
            .returning({ id: files.id })
            .then((rows) => {
              const id = rows[0]?.id
              if (!id) {
                reject({ status: 500, message: "Upload failed" })
                return
              }
              resolve({ url: `/api/files/${id}`, name: outName, size, type: outType })
            })
            .catch((err) => reject(err))
          return
        }
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
