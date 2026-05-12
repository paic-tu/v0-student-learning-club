import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { sendMail } from "@/lib/mail"

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(3).max(2000),
  company: z.string().optional(),
})

export async function GET() {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  return NextResponse.json({ ok: true, configured: Boolean(webhookUrl) })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    if (parsed.data.company && parsed.data.company.trim().length > 0) {
      return NextResponse.json({ ok: true })
    }

    // Send email notification
    await sendMail({
      to: "support@neonedu.org",
      subject: `New Contact Message from ${parsed.data.name}`,
      html: `
        <h3 style="color: #0f172a; font-size: 20px; font-weight: 800; margin-bottom: 20px;">رسالة تواصل جديدة</h3>
        <div style="background-color: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0;">
          <p style="margin: 10px 0;"><strong>الاسم:</strong> ${parsed.data.name}</p>
          <p style="margin: 10px 0;"><strong>البريد الإلكتروني:</strong> ${parsed.data.email}</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p><strong>الرسالة:</strong></p>
            <p style="white-space: pre-wrap; color: #475569;">${parsed.data.message}</p>
          </div>
        </div>
      `,
    })

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 })
    }

    const payload = {
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      createdAt: new Date().toISOString(),
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })

    const text = await res.text().catch(() => "")

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to submit", status: res.status, details: text.slice(0, 2000) },
        { status: 502 }
      )
    }

    const parsedResponse = (() => {
      try {
        return JSON.parse(text)
      } catch {
        return null
      }
    })()

    if (parsedResponse && parsedResponse.ok !== true) {
      return NextResponse.json(
        {
          error: "Failed to submit",
          details: typeof parsedResponse.error === "string" ? parsedResponse.error : "Webhook returned ok=false",
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[contact] submit error:", error)
    return NextResponse.json(
      { error: "Failed to submit", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
