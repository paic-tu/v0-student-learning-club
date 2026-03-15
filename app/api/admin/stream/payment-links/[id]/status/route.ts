import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { streamRequest } from "@/lib/payments/stream"

const schema = z.object({
  status: z.string().min(1),
})

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await requirePermission("store:write")
  const { id } = await props.params
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 })

  try {
    const data = await streamRequest<any>(`/payment_links/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: parsed.data.status }),
    })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

