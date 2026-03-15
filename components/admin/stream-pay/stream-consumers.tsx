"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

type StreamConsumer = {
  id: string
  name?: string
  phone_number?: string
  email?: string
  external_id?: string
  created_at?: string
}

function normalizeListPayload(payload: any): StreamConsumer[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export function StreamConsumersList({ lang }: { lang: string }) {
  const isAr = lang === "ar"
  const [items, setItems] = useState<StreamConsumer[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch("/api/admin/stream/consumers", { method: "GET" })
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
        <CardTitle>{isAr ? "Consumers" : "Consumers"}</CardTitle>
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
              <TableHead>{isAr ? "الجوال" : "Phone"}</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>{isAr ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">{c.id}</TableCell>
                <TableCell>{c.name || "-"}</TableCell>
                <TableCell className="font-mono text-xs">{c.phone_number || "-"}</TableCell>
                <TableCell className="font-mono text-xs">{c.email || "-"}</TableCell>
                <TableCell className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={`/${lang}/admin/stream-pay/consumers/get?id=${encodeURIComponent(c.id)}`}>{isAr ? "عرض" : "View"}</a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={`/${lang}/admin/stream-pay/consumers/update?id=${encodeURIComponent(c.id)}`}>{isAr ? "تعديل" : "Edit"}</a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                  {isAr ? "لا يوجد مستهلكين" : "No consumers"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function StreamConsumersCreate({ lang }: { lang: string }) {
  const isAr = lang === "ar"
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [externalId, setExternalId] = useState("")
  const [result, setResult] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const submit = () => {
    startTransition(async () => {
      try {
        setResult(null)
        const res = await fetch("/api/admin/stream/consumers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            phone_number: phone.trim() ? phone.trim() : null,
            email: email.trim() ? email.trim() : null,
            external_id: externalId.trim() ? externalId.trim() : null,
          }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        setResult(body)
        toast.success(isAr ? "تم إنشاء المستهلك" : "Consumer created")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "Create Consumer" : "Create Consumer"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="c-name">{isAr ? "الاسم" : "Name"}</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-phone">{isAr ? "الجوال" : "Phone"}</Label>
            <Input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-email">Email</Label>
            <Input id="c-email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-ext">External ID</Label>
            <Input id="c-ext" value={externalId} onChange={(e) => setExternalId(e.target.value)} dir="ltr" />
          </div>
        </div>

        <Button onClick={submit} disabled={!name.trim() || isPending}>
          {isPending ? (isAr ? "جاري الإنشاء..." : "Creating...") : isAr ? "إنشاء" : "Create"}
        </Button>

        {result && (
          <pre className="max-h-[420px] overflow-auto rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export function StreamConsumersGet({ lang, initialId }: { lang: string; initialId?: string }) {
  const isAr = lang === "ar"
  const [id, setId] = useState(initialId || "")
  const [result, setResult] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const run = () => {
    startTransition(async () => {
      try {
        setResult(null)
        const res = await fetch(`/api/admin/stream/consumers/${encodeURIComponent(id)}`, { method: "GET" })
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
        <CardTitle>{isAr ? "Get Consumer" : "Get Consumer"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gc-id">Consumer ID</Label>
          <Input id="gc-id" value={id} onChange={(e) => setId(e.target.value)} dir="ltr" />
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

export function StreamConsumersUpdate({ lang, initialId }: { lang: string; initialId?: string }) {
  const isAr = lang === "ar"
  const [id, setId] = useState(initialId || "")
  const [loaded, setLoaded] = useState<any>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [externalId, setExternalId] = useState("")
  const [isPending, startTransition] = useTransition()

  const load = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/stream/consumers/${encodeURIComponent(id)}`, { method: "GET" })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        setLoaded(body)
        setName(body?.name || "")
        setPhone(body?.phone_number || "")
        setEmail(body?.email || "")
        setExternalId(body?.external_id || "")
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
        patch.phone_number = phone.trim() ? phone.trim() : null
        patch.email = email.trim() ? email.trim() : null
        patch.external_id = externalId.trim() ? externalId.trim() : null

        const res = await fetch(`/api/admin/stream/consumers/${encodeURIComponent(id)}`, {
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
        const res = await fetch(`/api/admin/stream/consumers/${encodeURIComponent(id)}`, { method: "DELETE" })
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
        <CardTitle>{isAr ? "Update Consumer" : "Update Consumer"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="uc-id">Consumer ID</Label>
          <Input id="uc-id" value={id} onChange={(e) => setId(e.target.value)} dir="ltr" />
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
            <Label htmlFor="uc-name">{isAr ? "الاسم" : "Name"}</Label>
            <Input id="uc-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uc-phone">{isAr ? "الجوال" : "Phone"}</Label>
            <Input id="uc-phone" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uc-email">Email</Label>
            <Input id="uc-email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uc-ext">External ID</Label>
            <Input id="uc-ext" value={externalId} onChange={(e) => setExternalId(e.target.value)} dir="ltr" />
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

export function StreamConsumersDelete({ lang, initialId }: { lang: string; initialId?: string }) {
  const isAr = lang === "ar"
  const [id, setId] = useState(initialId || "")
  const [result, setResult] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const del = () => {
    startTransition(async () => {
      try {
        setResult(null)
        const res = await fetch(`/api/admin/stream/consumers/${encodeURIComponent(id)}`, { method: "DELETE" })
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
        <CardTitle>{isAr ? "Delete Consumer" : "Delete Consumer"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dc-id">Consumer ID</Label>
          <Input id="dc-id" value={id} onChange={(e) => setId(e.target.value)} dir="ltr" />
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
