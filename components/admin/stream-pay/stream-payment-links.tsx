"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type StreamPaymentLink = {
  id: string
  name?: string
  status?: string
  url?: string
  amount?: string
  currency?: string
  max_number_of_payments?: number | null
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

export function StreamPaymentLinksList({ lang }: { lang: string }) {
  const isAr = lang === "ar"
  const [items, setItems] = useState<StreamPaymentLink[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch("/api/admin/stream/payment-links", { method: "GET" })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) throw new Error(j?.error || "Failed")
        const rows = normalizeListPayload(j)
        if (!cancelled) setItems(rows)
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
        <CardTitle>{isAr ? "Payment Links" : "Payment Links"}</CardTitle>
        <Button variant="outline" onClick={() => setRefreshIndex((v) => v + 1)} disabled={loading}>
          {isAr ? "تحديث" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((pl) => (
              <TableRow key={pl.id}>
                <TableCell className="font-mono text-xs">{pl.id}</TableCell>
                <TableCell>{pl.name || "-"}</TableCell>
                <TableCell>{pl.status || "-"}</TableCell>
                <TableCell className="font-mono text-xs">
                  {pl.amount ? `${pl.amount} ${pl.currency || ""}` : "-"}
                </TableCell>
                <TableCell className="max-w-[260px] truncate">
                  {pl.url ? (
                    <a className="underline" href={pl.url} target="_blank" rel="noreferrer">
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
                  {isAr ? "لا يوجد روابط" : "No payment links"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function StreamPaymentLinksCreate({ lang, defaultSuccessUrl, defaultFailureUrl }: { lang: string; defaultSuccessUrl: string; defaultFailureUrl: string }) {
  const isAr = lang === "ar"
  const [name, setName] = useState("")
  const [currency, setCurrency] = useState("SAR")
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [consumerId, setConsumerId] = useState("")
  const [maxPayments, setMaxPayments] = useState("1")
  const [successUrl, setSuccessUrl] = useState(defaultSuccessUrl)
  const [failureUrl, setFailureUrl] = useState(defaultFailureUrl)
  const [metadataJson, setMetadataJson] = useState("{\n}\n")
  const [result, setResult] = useState<any>(null)

  const [products, setProducts] = useState<StreamProduct[]>([])
  const [consumers, setConsumers] = useState<StreamConsumer[]>([])
  const [isPending, startTransition] = useTransition()

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

  const canSubmit = useMemo(() => name.trim() && productId.trim() && Number(quantity) > 0, [name, productId, quantity])

  const submit = () => {
    startTransition(async () => {
      try {
        setResult(null)
        let custom_metadata: any = {}
        try {
          custom_metadata = metadataJson.trim() ? JSON.parse(metadataJson) : {}
        } catch {
          throw new Error(isAr ? "custom_metadata JSON غير صالح" : "Invalid custom_metadata JSON")
        }

        const payload: any = {
          name,
          currency,
          items: [{ product_id: productId, quantity: Number(quantity) }],
          max_number_of_payments: maxPayments.trim() ? Number(maxPayments) : 1,
          success_redirect_url: successUrl.trim() ? successUrl.trim() : null,
          failure_redirect_url: failureUrl.trim() ? failureUrl.trim() : null,
          custom_metadata,
          contact_information_type: "PHONE",
        }
        if (consumerId.trim()) payload.organization_consumer_id = consumerId.trim()

        const res = await fetch("/api/admin/stream/payment-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        setResult(body)
        toast.success(isAr ? "تم إنشاء الرابط" : "Payment link created")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "Create Payment Link" : "Create Payment Link"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pl-name">{isAr ? "الاسم" : "Name"}</Label>
            <Input id="pl-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-currency">Currency</Label>
            <Input id="pl-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-product">Product ID</Label>
            <Input id="pl-product" value={productId} onChange={(e) => setProductId(e.target.value)} dir="ltr" />
            {products.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {isAr ? "أمثلة منتجات:" : "Product examples:"}{" "}
                {products.slice(0, 2).map((p) => (
                  <span key={p.id} className="font-mono">
                    {p.id}{" "}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-qty">{isAr ? "الكمية" : "Quantity"}</Label>
            <Input id="pl-qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-consumer">Consumer ID (optional)</Label>
            <Input id="pl-consumer" value={consumerId} onChange={(e) => setConsumerId(e.target.value)} dir="ltr" />
            {consumers.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {isAr ? "أمثلة مستهلكين:" : "Consumer examples:"}{" "}
                {consumers.slice(0, 2).map((c) => (
                  <span key={c.id} className="font-mono">
                    {c.id}{" "}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-max">Max Number Of Payments</Label>
            <Input id="pl-max" value={maxPayments} onChange={(e) => setMaxPayments(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-success">Success Redirect URL</Label>
            <Input id="pl-success" value={successUrl} onChange={(e) => setSuccessUrl(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-failure">Failure Redirect URL</Label>
            <Input id="pl-failure" value={failureUrl} onChange={(e) => setFailureUrl(e.target.value)} dir="ltr" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pl-meta">custom_metadata (JSON)</Label>
          <Textarea id="pl-meta" value={metadataJson} onChange={(e) => setMetadataJson(e.target.value)} className="min-h-[160px] font-mono text-xs" dir="ltr" />
        </div>

        <Button onClick={submit} disabled={!canSubmit || isPending}>
          {isPending ? (isAr ? "جاري الإنشاء..." : "Creating...") : isAr ? "إنشاء" : "Create"}
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

export function StreamPaymentLinksGet({ lang, initialId }: { lang: string; initialId?: string }) {
  const isAr = lang === "ar"
  const [id, setId] = useState(initialId || "")
  const [result, setResult] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const run = () => {
    startTransition(async () => {
      try {
        setResult(null)
        const res = await fetch(`/api/admin/stream/payment-links/${encodeURIComponent(id)}`, { method: "GET" })
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
        <CardTitle>{isAr ? "Get Payment Link" : "Get Payment Link"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gpl-id">Payment Link ID</Label>
          <Input id="gpl-id" value={id} onChange={(e) => setId(e.target.value)} dir="ltr" />
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

export function StreamPaymentLinksUpdateStatus({ lang, initialId }: { lang: string; initialId?: string }) {
  const isAr = lang === "ar"
  const [id, setId] = useState(initialId || "")
  const [status, setStatus] = useState("ACTIVE")
  const [result, setResult] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const save = () => {
    startTransition(async () => {
      try {
        setResult(null)
        const res = await fetch(`/api/admin/stream/payment-links/${encodeURIComponent(id)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        setResult(body)
        toast.success(isAr ? "تم التحديث" : "Updated")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "Update Payment Link Status" : "Update Payment Link Status"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="upl-id">Payment Link ID</Label>
            <Input id="upl-id" value={id} onChange={(e) => setId(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="upl-status">Status</Label>
            <Input id="upl-status" value={status} onChange={(e) => setStatus(e.target.value)} dir="ltr" />
          </div>
        </div>
        <Button onClick={save} disabled={!id.trim() || !status.trim() || isPending}>
          {isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : isAr ? "حفظ" : "Save"}
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

