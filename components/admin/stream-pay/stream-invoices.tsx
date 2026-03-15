"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type StreamInvoice = {
  id: string
  status?: string
  currency?: string
  amount?: string
  url?: string
  organization_consumer_id?: string
  created_at?: string
}

type StreamProduct = { id: string; name?: string }
type StreamConsumer = { id: string; name?: string }

function normalizeListPayload(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export function StreamInvoicesCreate({ lang }: { lang: string }) {
  const isAr = lang === "ar"
  const [consumerId, setConsumerId] = useState("")
  const [currency, setCurrency] = useState("SAR")
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [scheduledOn, setScheduledOn] = useState("")
  const [extraJson, setExtraJson] = useState("{\n  \"metadata\": {}\n}\n")
  const [result, setResult] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const [products, setProducts] = useState<StreamProduct[]>([])
  const [consumers, setConsumers] = useState<StreamConsumer[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch("/api/admin/stream/products").then((r) => r.json().catch(() => null)),
      fetch("/api/admin/stream/consumers").then((r) => r.json().catch(() => null)),
    ])
      .then(([p, c]) => {
        if (cancelled) return
        setProducts(normalizeListPayload(p) as any)
        setConsumers(normalizeListPayload(c) as any)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const canSubmit = useMemo(() => consumerId.trim() && productId.trim() && Number(quantity) > 0, [consumerId, productId, quantity])

  const submit = () => {
    startTransition(async () => {
      try {
        setResult(null)
        let extra: any = {}
        try {
          extra = extraJson.trim() ? JSON.parse(extraJson) : {}
        } catch {
          throw new Error(isAr ? "JSON غير صالح" : "Invalid JSON")
        }

        const payload: any = {
          ...extra,
          notify_consumer: true,
          organization_consumer_id: consumerId.trim(),
          currency,
          items: [{ product_id: productId.trim(), quantity: Number(quantity) }],
          payment_methods: {
            mada: true,
            visa: true,
            mastercard: true,
            amex: true,
            bank_transfer: true,
            installment: true,
          },
          scheduled_on: scheduledOn.trim()
            ? new Date(`${scheduledOn.trim()}T00:00:00.000Z`).toISOString()
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }

        const res = await fetch("/api/admin/stream/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        setResult(body)
        toast.success(isAr ? "تم إنشاء الفاتورة" : "Invoice created")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "إنشاء فاتورة" : "Create Invoice"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inv-consumer">Organization Consumer ID</Label>
            <Input id="inv-consumer" value={consumerId} onChange={(e) => setConsumerId(e.target.value)} dir="ltr" />
            {consumers.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {isAr ? "أمثلة:" : "Examples:"}{" "}
                {consumers.slice(0, 2).map((c) => (
                  <span key={c.id} className="font-mono">
                    {c.id}{" "}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-currency">Currency</Label>
            <Input id="inv-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-scheduled">{isAr ? "تاريخ الاستحقاق" : "Due date"}</Label>
            <Input id="inv-scheduled" type="date" value={scheduledOn} onChange={(e) => setScheduledOn(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-product">Product ID</Label>
            <Input id="inv-product" value={productId} onChange={(e) => setProductId(e.target.value)} dir="ltr" />
            {products.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {isAr ? "أمثلة:" : "Examples:"}{" "}
                {products.slice(0, 2).map((p) => (
                  <span key={p.id} className="font-mono">
                    {p.id}{" "}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-qty">{isAr ? "الكمية" : "Quantity"}</Label>
            <Input id="inv-qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} dir="ltr" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inv-extra">{isAr ? "حقول إضافية (اختياري)" : "Extra fields (optional)"}</Label>
          <Textarea id="inv-extra" value={extraJson} onChange={(e) => setExtraJson(e.target.value)} className="min-h-[160px] font-mono text-xs" dir="ltr" />
        </div>

        <Button onClick={submit} disabled={!canSubmit || isPending}>
          {isPending ? (isAr ? "جاري الإنشاء..." : "Creating...") : isAr ? "إنشاء فاتورة" : "Create Invoice"}
        </Button>

        {result && (
          <pre className="max-h-[520px] overflow-auto rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export function StreamInvoicesList({ lang }: { lang: string }) {
  const isAr = lang === "ar"
  const [items, setItems] = useState<StreamInvoice[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch("/api/admin/stream/invoices", { method: "GET" })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) throw new Error(j?.error || "Failed")
        const rows = normalizeListPayload(j)
        if (!cancelled) setItems(rows as any)
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed"))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refreshIndex])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{isAr ? "الفواتير" : "Invoices"}</CardTitle>
        <Button variant="outline" onClick={() => setRefreshIndex((v) => v + 1)} disabled={loading}>
          {isAr ? "تحديث" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Consumer</TableHead>
              <TableHead>URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                <TableCell>{inv.status || "-"}</TableCell>
                <TableCell className="font-mono text-xs">
                  {inv.amount ? `${inv.amount} ${inv.currency || ""}` : "-"}
                </TableCell>
                <TableCell className="font-mono text-xs">{inv.organization_consumer_id || "-"}</TableCell>
                <TableCell className="max-w-[260px] truncate">
                  {inv.url ? (
                    <a className="underline" href={inv.url} target="_blank" rel="noreferrer">
                      {isAr ? "فتح" : "Open"}
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                  {isAr ? "لا يوجد فواتير" : "No invoices"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function StreamInvoicesGet({ lang, initialId }: { lang: string; initialId?: string }) {
  const isAr = lang === "ar"
  const [id, setId] = useState(initialId || "")
  const [result, setResult] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const run = () => {
    startTransition(async () => {
      try {
        setResult(null)
        const res = await fetch(`/api/admin/stream/invoices/${encodeURIComponent(id)}`, { method: "GET" })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        setResult(body)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "جلب فاتورة" : "Get Invoice"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gi-id">Invoice ID</Label>
          <Input id="gi-id" value={id} onChange={(e) => setId(e.target.value)} dir="ltr" />
        </div>
        <Button onClick={run} disabled={!id.trim() || isPending}>
          {isPending ? (isAr ? "جاري الجلب..." : "Fetching...") : isAr ? "جلب" : "Fetch"}
        </Button>
        {result && (
          <pre className="max-h-[520px] overflow-auto rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
