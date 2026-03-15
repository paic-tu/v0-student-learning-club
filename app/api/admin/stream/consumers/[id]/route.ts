import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requirePermission } from "@/lib/rbac/require-permission"
import { streamRequest } from "@/lib/payments/stream"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone_number: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  external_id: z.string().optional().nullable(),
})

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await requirePermission("store:read")
  const { id } = await props.params
  try {
    const data = await streamRequest<any>(`/consumers/${id}`, { method: "GET" })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await requirePermission("store:write")
  const { id } = await props.params
  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 })

  try {
    const data = await streamRequest<any>(`/consumers/${id}`, { method: "PATCH", body: JSON.stringify(parsed.data) })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await requirePermission("store:write")
  const { id } = await props.params
  try {
    const data = await streamRequest<any>(`/consumers/${id}`, { method: "DELETE" })
    return NextResponse.json(data ?? { success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

