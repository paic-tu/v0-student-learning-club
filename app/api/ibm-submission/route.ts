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

    // Send notification email to support
    await sendMail({
      to: "support@neonedu.org",
      subject: `New IBM Course Submission: ${fullName}`,
      html: `
        <h3 style="color: #0f172a; font-size: 20px; font-weight: 800; margin-bottom: 20px;">طلب جديد للمشاركة في معسكر نيون Ai Era Comp</h3>
        <div style="background-color: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0;">
          <p style="margin: 10px 0;"><strong>الاسم:</strong> ${fullName}</p>
          <p style="margin: 10px 0;"><strong>البريد:</strong> ${email}</p>
          <p style="margin: 10px 0;"><strong>الهاتف:</strong> ${phoneNumber}</p>
          <p style="margin: 10px 0;"><strong>تاريخ الإتمام:</strong> ${completionDate}</p>
          <p style="margin: 10px 0;"><strong>الحالة المهنية:</strong> ${employmentStatus}</p>
          <div style="margin-top: 20px; display: flex; gap: 10px;">
            <a href="${certificateUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">عرض الشهادة المرفوعة</a>
          </div>
          ${notes ? `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;"><p><strong>ملاحظات:</strong></p><p>${notes}</p></div>` : ""}
        </div>
      `,
    })

    // Send the generated certificate to the user's email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const userCertUrl = `${appUrl}/api/ibm-submission/certificate/${submission[0].id}`
    
    await sendMail({
      to: email,
      subject: `شهادة إتمام معسكر نيون Ai Era Comp - ${fullName}`,
      html: `
        <h3 style="color: #0f172a; font-size: 22px; font-weight: 800; margin-bottom: 20px;">تهانينا لك يا ${fullName.split(' ')[0]}!</h3>
        <p style="font-size: 16px; color: #475569; line-height: 1.8;">نبارك لك إتمامك لمتطلبات معسكر <strong>نيون Ai Era Comp</strong> بنجاح. يسعدنا أن نرفق لك رابط تحميل شهادة إتمام المعسكر الرسمية الخاصة بك.</p>
        
        <div style="margin: 40px 0; text-align: center;">
          <a href="${userCertUrl}" style="display: inline-block; padding: 18px 36px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 18px; box-shadow: 0 10px 20px -5px rgba(0, 112, 243, 0.3);">تحميل شهادتك الآن</a>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; border-right: 4px solid #0070f3;">
          <p style="margin: 0; font-size: 14px; color: #475569;"><strong>ملاحظة:</strong> يمكنك الاحتفاظ بهذا البريد للرجوع للشهادة في أي وقت، أو مشاركة الرابط في ملفك المهني على LinkedIn.</p>
        </div>
        
        <p style="margin-top: 30px; font-size: 15px; color: #64748b;">نتمنى لك كل التوفيق في مسيرتك المهنية القادمة.</p>
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
