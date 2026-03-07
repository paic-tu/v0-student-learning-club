"use server"

import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { nanoid } from "nanoid"

export async function uploadFileAction(formData: FormData) {
  try {
    const file = formData.get("file") as File
    
    if (!file) {
      console.error("Upload error: No file provided in formData")
      return { error: "No file provided" }
    }

    console.log("Processing upload for file:", file.name, "Type:", file.type, "Size:", file.size)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads")
    console.log("Uploads directory:", uploadsDir)

    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory likely exists
      console.log("Directory creation info (might exist):", error)
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg"
    const filename = `${nanoid()}.${ext}`
    const filepath = join(uploadsDir, filename)

    console.log("Writing file to:", filepath)

    // Write file
    await writeFile(filepath, buffer)

    console.log("File written successfully")

    // Return public URL
    const url = `/uploads/${filename}`
    
    return { success: true, url }
  } catch (error: any) {
    console.error("Upload detailed error:", error)
    return { error: `Failed to upload file: ${error.message}` }
  }
}
