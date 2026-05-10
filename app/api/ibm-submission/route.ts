import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ibmSubmissions } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { sendMail } from "@/lib/mail"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const data = await request.json()

    const {
      fullName,
      email,
      phoneNumber,
      completionDate,
      certificateUrl,
      employmentStatus,
      resumeUrl,
      notes,
    } = data

    // Basic validation
    if (!fullName || !email || !phoneNumber || !completionDate || !certificateUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Date validation (11 May to 20 May 2026)
    const date = new Date(completionDate)
    const startDate = new Date("2026-05-11")
    const endDate = new Date("2026-05-20")

    if (date < startDate || date > endDate) {
      return NextResponse.json(
        { error: "الشهادة يجب أن تكون صادرة خلال فترة إقامة المعسكر من 11 مايو حتى 20 مايو فقط." },
        { status: 400 }
      )
    }

    const submission = await db.insert(ibmSubmissions).values({
      fullName,
      email,
      phoneNumber,
      completionDate: date,
      certificateUrl,
      employmentStatus,
      resumeUrl,
      notes,
      userId: session?.user?.id || null,
      createdAt: new Date(),
    }).returning()

    // Send notification email
    await sendMail({
      to: "support@neonedu.org",
      subject: `New IBM Course Submission: ${fullName}`,
      html: `
        <h3>New IBM Course Submission</h3>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phoneNumber}</p>
        <p><strong>Completion Date:</strong> ${completionDate}</p>
        <p><strong>Employment Status:</strong> ${employmentStatus}</p>
        <p><a href="${certificateUrl}">View Certificate</a></p>
        ${resumeUrl ? `<p><a href="${resumeUrl}">View Resume</a></p>` : ""}
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
      `,
    })

    return NextResponse.json({
      success: true,
      data: submission[0],
    })
  } catch (error: any) {
    console.error("IBM Submission Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
