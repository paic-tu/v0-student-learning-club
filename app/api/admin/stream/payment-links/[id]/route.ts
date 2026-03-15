import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/rbac/require-permission"
import { streamRequest } from "@/lib/payments/stream"

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await requirePermission("store:read")
  const { id } = await props.params
  try {
    const data = await streamRequest<any>(`/payment_links/${id}`, { method: "GET" })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

