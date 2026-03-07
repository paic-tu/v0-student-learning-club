"use server"

import { db } from "@/lib/db"
import { files } from "@/lib/db/schema"

export async function uploadFileAction(formData: FormData) {
  try {
    const file = formData.get("file") as File
    
    if (!file) {
      console.error("Upload error: No file provided in formData")
      return { error: "No file provided" }
    }

    console.log("Processing upload for file:", file.name, "Type:", file.type, "Size:", file.size)

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString("base64")

    console.log("Saving file to database...")

    // Insert into database
    const [insertedFile] = await db.insert(files).values({
      name: file.name,
      type: file.type,
      data: base64Data,
      size: file.size,
    }).returning({ id: files.id })

    console.log("File saved to database with ID:", insertedFile.id)

    // Return API route URL
    const url = `/api/files/${insertedFile.id}`
    
    return { success: true, url }
  } catch (error: any) {
    console.error("Upload detailed error:", error)
    return { error: `Failed to upload file: ${error.message}` }
  }
}
