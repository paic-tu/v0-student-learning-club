import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { streamRequest } from "@/lib/payments/stream"

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["RECURRING", "ONE_OFF", "METERED"]).or(z.enum(["ONE_TIME"])),
  currency: z.string().default("SAR"),
  price: z.string().min(1).optional(),
  amount: z.string().min(1).optional(),
})

export async function GET(req: NextRequest) {
  await requirePermission("store:read")
  const query = req.nextUrl.searchParams.toString()
  try {
    const data = await streamRequest<any>(`/products${query ? `?${query}` : ""}`, { method: "GET" })
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
    const rawPrice = parsed.data.price ?? parsed.data.amount
    if (!rawPrice) return NextResponse.json({ error: "Validation failed" }, { status: 400 })
    const payload = {
      ...parsed.data,
      type: parsed.data.type === "ONE_TIME" ? "ONE_OFF" : parsed.data.type,
      price: rawPrice,
    }
    delete (payload as any).amount
    const data = await streamRequest<any>(`/products`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
