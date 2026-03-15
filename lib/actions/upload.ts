"use server"

import { db } from "@/lib/db"
import { files } from "@/lib/db/schema"
import { auth } from "@/lib/auth"

export async function uploadFileAction(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    if (session.user.role !== "admin" && session.user.role !== "instructor") return { error: "Forbidden" }

    const file = formData.get("file") as File
    
    if (!file) return { error: "No file provided" }
    if (file.size > 15 * 1024 * 1024) return { error: "File too large (max 15MB)" }

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
    
    return { success: true, url }
  } catch (error: any) {
    return { error: `Failed to upload file: ${error.message}` }
  }
}
