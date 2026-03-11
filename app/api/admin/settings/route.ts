import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { getSiteSettings, updateSiteSettings } from "@/lib/db/queries"

export async function GET() {
  try {
    await requirePermission("settings:read")
    const data = await getSiteSettings()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load settings" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requirePermission("settings:write")
    const body = await req.json()
    const payload = {
      siteName: String(body.siteName || ""),
      supportEmail: String(body.supportEmail || ""),
      maintenanceMode: Boolean(body.maintenanceMode),
      allowRegistration: Boolean(body.allowRegistration),
      currency: String(body.currency || "SAR"),
      email: {
        smtpHost: body?.email?.smtpHost ? String(body.email.smtpHost) : undefined,
        smtpPort: body?.email?.smtpPort ? Number(body.email.smtpPort) : undefined,
        notifications: Boolean(body?.email?.notifications),
      },
      features: {
        showStore: Boolean(body?.features?.showStore),
        showMentors: Boolean(body?.features?.showMentors),
        enableLive: Boolean(body?.features?.enableLive),
      },
    }
    const res = await updateSiteSettings(payload)
    if (!res.ok) {
      return NextResponse.json({ error: res.error || "Update failed" }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update settings" }, { status: 500 })
  }
}
