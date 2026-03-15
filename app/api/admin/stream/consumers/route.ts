import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { streamRequest } from "@/lib/payments/stream"

const createSchema = z.object({
  name: z.string().min(1),
  phone_number: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  external_id: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  await requirePermission("store:read")
  const query = req.nextUrl.searchParams.toString()
  try {
    const data = await streamRequest<any>(`/consumers${query ? `?${query}` : ""}`, { method: "GET" })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await requirePermission("store:write")
  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 })

  try {
    const data = await streamRequest<any>(`/consumers`, { method: "POST", body: JSON.stringify(parsed.data) })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

