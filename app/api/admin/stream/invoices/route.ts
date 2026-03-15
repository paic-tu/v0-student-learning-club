import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { streamRequest } from "@/lib/payments/stream"

const createSchema = z
  .object({
    organization_consumer_id: z.string().uuid(),
    currency: z.string().default("SAR"),
    items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1) })).min(1),
    payment_methods: z.record(z.boolean()),
    scheduled_on: z.string().min(1),
    notify_consumer: z.boolean().optional(),
    description: z.string().optional().nullable(),
  })
  .passthrough()

export async function GET(req: NextRequest) {
  await requirePermission("store:read")
  const query = req.nextUrl.searchParams.toString()
  try {
    const data = await streamRequest<any>(`/invoices${query ? `?${query}` : ""}`, { method: "GET" })
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
    const data = await streamRequest<any>(`/invoices`, { method: "POST", body: JSON.stringify(parsed.data) })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
