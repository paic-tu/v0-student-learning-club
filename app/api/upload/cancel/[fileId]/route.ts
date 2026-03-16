import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { files } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"

export async function DELETE(_req: NextRequest, props: { params: Promise<{ fileId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { fileId } = await props.params
  if (!fileId) return NextResponse.json({ error: "Invalid params" }, { status: 400 })

  await db.delete(files).where(eq(files.id, fileId))
  return NextResponse.json({ success: true })
}

