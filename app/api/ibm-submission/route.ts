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
        <h3 style="color: #0f172a; font-size: 20px; font-weight: 800; margin-bottom: 20px;">طلب جديد للمشاركة في كورسات IBM</h3>
        <div style="background-color: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0;">
          <p style="margin: 10px 0;"><strong>الاسم:</strong> ${fullName}</p>
          <p style="margin: 10px 0;"><strong>البريد:</strong> ${email}</p>
          <p style="margin: 10px 0;"><strong>الهاتف:</strong> ${phoneNumber}</p>
          <p style="margin: 10px 0;"><strong>تاريخ الإتمام:</strong> ${completionDate}</p>
          <p style="margin: 10px 0;"><strong>الحالة المهنية:</strong> ${employmentStatus}</p>
          <div style="margin-top: 20px; display: flex; gap: 10px;">
            <a href="${certificateUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">عرض الشهادة</a>
            ${resumeUrl ? `<a href="${resumeUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; margin-right: 10px;">عرض السيرة الذاتية</a>` : ""}
          </div>
          ${notes ? `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;"><p><strong>ملاحظات:</strong></p><p>${notes}</p></div>` : ""}
        </div>
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
