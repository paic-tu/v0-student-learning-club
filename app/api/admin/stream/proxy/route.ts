import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { streamRequest } from "@/lib/payments/stream"
import { requirePermission } from "@/lib/rbac/require-permission"

const schema = z.object({
  method: z.enum(["GET", "POST", "PATCH", "PUT", "DELETE"]),
  path: z.string().min(1),
  query: z.record(z.string()).optional(),
  body: z.unknown().optional(),
})

function isSafePath(p: string) {
  if (!p.startsWith("/")) return false
  if (p.includes("://")) return false
  if (p.includes("\\")) return false
  const allowedPrefixes = ["/payment_links", "/consumers", "/coupons", "/invoices", "/payments", "/products"]
  return allowedPrefixes.some((prefix) => p === prefix || p.startsWith(prefix + "/"))
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null)
  const parsed = schema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const { method, path, query, body } = parsed.data
  if (!isSafePath(path)) return NextResponse.json({ error: "Path not allowed" }, { status: 400 })

  if (method === "GET") await requirePermission("store:read")
  else await requirePermission("store:write")

  const qs =
    query && Object.keys(query).length > 0
      ? "?" +
        Object.entries(query)
          .filter(([, v]) => typeof v === "string" && v.length > 0)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join("&")
      : ""

  try {
    const res = await streamRequest<any>(`${path}${qs}`, {
      method,
      body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(body ?? {}),
    })
    return NextResponse.json({ success: true, data: res })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Stream request failed" }, { status: 500 })
  }
}

