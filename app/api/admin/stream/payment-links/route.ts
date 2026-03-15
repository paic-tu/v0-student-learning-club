import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { streamRequest } from "@/lib/payments/stream"

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  currency: z.string().default("SAR"),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1) })).min(1),
  max_number_of_payments: z.number().int().min(1).optional().nullable(),
  valid_until: z.string().optional().nullable(),
  confirmation_message: z.string().optional().nullable(),
  success_redirect_url: z.string().url().optional().nullable(),
  failure_redirect_url: z.string().url().optional().nullable(),
  organization_consumer_id: z.string().uuid().optional().nullable(),
  custom_metadata: z.record(z.any()).optional().nullable(),
  contact_information_type: z.enum(["PHONE", "EMAIL"]).optional().nullable(),
})

export async function GET(req: NextRequest) {
  await requirePermission("store:read")
  const query = req.nextUrl.searchParams.toString()
  try {
    const data = await streamRequest<any>(`/payment_links${query ? `?${query}` : ""}`, { method: "GET" })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await requirePermission("store:write")
  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })

  try {
    const data = await streamRequest<any>(`/payment_links`, { method: "POST", body: JSON.stringify(parsed.data) })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

