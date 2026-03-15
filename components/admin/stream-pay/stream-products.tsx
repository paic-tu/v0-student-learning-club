"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

type StreamProduct = {
  id: string
  name?: string
  type?: string
  currency?: string
  amount?: string
  active?: boolean
  created_at?: string
}

function normalizeListPayload(payload: any): StreamProduct[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export function StreamProductsList({ lang }: { lang: string }) {
  const isAr = lang === "ar"
  const [items, setItems] = useState<StreamProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch("/api/admin/stream/products", { method: "GET" })
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
        <CardTitle>{isAr ? "Products" : "Products"}</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRefreshIndex((v) => v + 1)} disabled={loading}>
            {isAr ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>{isAr ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.id}</TableCell>
                <TableCell>{p.name || "-"}</TableCell>
                <TableCell>{p.type || "-"}</TableCell>
                <TableCell className="font-mono text-xs">
                  {p.amount ? `${p.amount} ${p.currency || ""}` : "-"}
                </TableCell>
                <TableCell>{typeof p.active === "boolean" ? String(p.active) : "-"}</TableCell>
                <TableCell className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={`/${lang}/admin/stream-pay/products/get?id=${encodeURIComponent(p.id)}`}>
                      {isAr ? "عرض" : "View"}
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={`/${lang}/admin/stream-pay/products/update?id=${encodeURIComponent(p.id)}`}>
                      {isAr ? "تعديل" : "Edit"}
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                  {isAr ? "لا يوجد منتجات" : "No products"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function StreamProductsCreate({ lang }: { lang: string }) {
  const isAr = lang === "ar"
  const [name, setName] = useState("")
  const [type, setType] = useState("ONE_OFF")
  const [currency, setCurrency] = useState("SAR")
  const [price, setPrice] = useState("10.00")
  const [result, setResult] = useState<any>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const canSubmit = useMemo(() => name.trim() && type.trim() && currency.trim() && price.trim(), [name, type, currency, price])

  const submit = () => {
    startTransition(async () => {
      try {
        setErrorText(null)
        setResult(null)
        const res = await fetch("/api/admin/stream/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, type, currency, price }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error ? String(body.error) : `HTTP ${res.status}`)
        setResult(body)
        toast.success(isAr ? "تم إنشاء المنتج" : "Product created")
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed"
        setErrorText(msg)
        toast.error(msg)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "Create Product" : "Create Product"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-name">{isAr ? "الاسم" : "Name"}</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="p-type" dir="ltr">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONE_OFF">ONE_OFF</SelectItem>
                <SelectItem value="RECURRING">RECURRING</SelectItem>
                <SelectItem value="METERED">METERED</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="p-currency" dir="ltr">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SAR">SAR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-price">Price</Label>
            <Input id="p-price" value={price} onChange={(e) => setPrice(e.target.value)} dir="ltr" />
          </div>
        </div>

        <Button onClick={submit} disabled={!canSubmit || isPending}>
          {isPending ? (isAr ? "جاري الإنشاء..." : "Creating...") : isAr ? "إنشاء" : "Create"}
        </Button>

        {errorText && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errorText}
          </div>
        )}

        {result && (
          <pre className="max-h-[420px] overflow-auto rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export function StreamProductsGet({ lang }: { lang: string }) {
  const isAr = lang === "ar"
  const [id, setId] = useState("")
  const [result, setResult] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const run = () => {
    startTransition(async () => {
      try {
        setResult(null)
        const res = await fetch(`/api/admin/stream/products/${encodeURIComponent(id)}`, { method: "GET" })
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
        <CardTitle>{isAr ? "Get Product" : "Get Product"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gp-id">Product ID</Label>
          <Input id="gp-id" value={id} onChange={(e) => setId(e.target.value)} dir="ltr" />
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

export function StreamProductsUpdate({ lang, initialId }: { lang: string; initialId?: string }) {
  const isAr = lang === "ar"
  const [id, setId] = useState(initialId || "")
  const [loaded, setLoaded] = useState<any>(null)
  const [name, setName] = useState("")
  const [active, setActive] = useState<string>("")
  const [price, setPrice] = useState("")
  const [isPending, startTransition] = useTransition()

  const load = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/stream/products/${encodeURIComponent(id)}`, { method: "GET" })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        setLoaded(body)
        setName(body?.name || "")
        setPrice(body?.price || body?.amount || "")
        setActive(typeof body?.active === "boolean" ? String(body.active) : "")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  const save = () => {
    startTransition(async () => {
      try {
        const patch: any = {}
        if (name.trim()) patch.name = name.trim()
        if (price.trim()) patch.price = price.trim()
        if (active.trim()) patch.active = active.trim().toLowerCase() === "true"

        const res = await fetch(`/api/admin/stream/products/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        setLoaded(body)
        toast.success(isAr ? "تم الحفظ" : "Saved")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  const del = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/stream/products/${encodeURIComponent(id)}`, { method: "DELETE" })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        setLoaded(body)
        toast.success(isAr ? "تم الحذف" : "Deleted")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "Update Product" : "Update Product"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="up-id">Product ID</Label>
          <Input id="up-id" value={id} onChange={(e) => setId(e.target.value)} dir="ltr" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={load} disabled={!id.trim() || isPending}>
            {isAr ? "تحميل" : "Load"}
          </Button>
          <Button onClick={save} disabled={!id.trim() || isPending}>
            {isAr ? "حفظ" : "Save"}
          </Button>
          <Button variant="destructive" onClick={del} disabled={!id.trim() || isPending}>
            {isAr ? "حذف" : "Delete"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="up-name">{isAr ? "الاسم" : "Name"}</Label>
            <Input id="up-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="up-price">Price</Label>
            <Input id="up-price" value={price} onChange={(e) => setPrice(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="up-active">Active (true/false)</Label>
            <Input id="up-active" value={active} onChange={(e) => setActive(e.target.value)} dir="ltr" />
          </div>
        </div>

        {loaded && (
          <pre className="max-h-[520px] overflow-auto rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">
            {JSON.stringify(loaded, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export function StreamProductsDelete({ lang, initialId }: { lang: string; initialId?: string }) {
  const isAr = lang === "ar"
  const [id, setId] = useState(initialId || "")
  const [result, setResult] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const del = () => {
    startTransition(async () => {
      try {
        setResult(null)
        const res = await fetch(`/api/admin/stream/products/${encodeURIComponent(id)}`, { method: "DELETE" })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        setResult(body)
        toast.success(isAr ? "تم الحذف" : "Deleted")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "Delete Product" : "Delete Product"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dp-id">Product ID</Label>
          <Input id="dp-id" value={id} onChange={(e) => setId(e.target.value)} dir="ltr" />
        </div>
        <Button variant="destructive" onClick={del} disabled={!id.trim() || isPending}>
          {isPending ? (isAr ? "جاري الحذف..." : "Deleting...") : isAr ? "حذف" : "Delete"}
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
