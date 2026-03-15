"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export function StoreCourseControls(props: {
  courseId: string
  initialPrice: string | number
  initialPublished: boolean
  initialStreamProductId?: string | null
}) {
  const [price, setPrice] = useState(String(props.initialPrice ?? "0"))
  const [published, setPublished] = useState(Boolean(props.initialPublished))
  const [streamProductId, setStreamProductId] = useState<string | null>(props.initialStreamProductId || null)
  const [isPending, startTransition] = useTransition()

  const save = () => {
    startTransition(async () => {
      try {
        const payload = {
          price: Number.parseFloat(price),
          is_published: published,
        }
        const res = await fetch(`/api/admin/courses/${encodeURIComponent(props.courseId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        toast.success("Saved")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  const syncToStream = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/stream/courses/${encodeURIComponent(props.courseId)}/sync`, { method: "POST" })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        setStreamProductId(String(body?.streamProductId || ""))
        toast.success("Synced to Stream")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <div className="grid gap-1">
        <Label className="text-xs">Price (SAR)</Label>
        <Input value={price} onChange={(e) => setPrice(e.target.value)} className="h-8 w-28" dir="ltr" />
      </div>
      <div className="grid gap-1">
        <Label className="text-xs">Published</Label>
        <Switch checked={published} onCheckedChange={(v) => setPublished(Boolean(v))} />
      </div>
      <Button size="sm" onClick={save} disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
      <div className="grid gap-1">
        <Label className="text-xs">Stream</Label>
        <Button size="sm" variant="outline" onClick={syncToStream} disabled={isPending}>
          {streamProductId ? "Resync" : "Sync"}
        </Button>
      </div>
    </div>
  )
}
