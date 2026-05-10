import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ibmSubmissions } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { issuedCertificateUrl } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const updated = await db
      .update(ibmSubmissions)
      .set({
        issuedCertificateUrl,
      })
      .where(eq(ibmSubmissions.id, id))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated[0] })
  } catch (error: any) {
    console.error("IBM Submission Update Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
