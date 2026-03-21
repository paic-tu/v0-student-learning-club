"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Calendar, Clock } from "lucide-react"

type Expert = {
  id: string
  nameEn: string
  nameAr: string
  fieldEn: string
  fieldAr: string
  imageUrl: string | null
  slots: Array<{ id: string; startAt: string; endAt: string }>
}

export function ConsultationsCards() {
  const { language } = useLanguage()
  const isAr = language === "ar"
  const { user } = useAuth()
  const [experts, setExperts] = useState<Expert[]>([])
  const [loading, setLoading] = useState(true)
  const [portraitByUrl, setPortraitByUrl] = useState<Record<string, boolean>>({})
  const [bookingOpenFor, setBookingOpenFor] = useState<string | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<Record<string, string>>({})
  const [selectedDateKey, setSelectedDateKey] = useState<Record<string, string>>({})
  const [requesterInfo, setRequesterInfo] = useState<Record<string, { name: string; email: string; phone: string }>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/consultations", { cache: "no-store" })
        const data = await res.json()
        setExperts(data.experts || [])
      } catch {
        setExperts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const urls = Array.from(
      new Set(
        experts
          .map((e) => e.imageUrl)
          .filter((u): u is string => typeof u === "string" && u.length > 0),
      ),
    )

    const missing = urls.filter((u) => portraitByUrl[u] === undefined)
    if (missing.length === 0) return

    let cancelled = false
    for (const url of missing) {
      try {
        const img = new window.Image()
        img.onload = () => {
          if (cancelled) return
          const w = img.naturalWidth || img.width
          const h = img.naturalHeight || img.height
          const isPortrait = w > 0 && h > 0 ? h / w >= 1.1 : false
          setPortraitByUrl((prev) => ({ ...prev, [url]: isPortrait }))
        }
        img.onerror = () => {
          if (cancelled) return
          setPortraitByUrl((prev) => ({ ...prev, [url]: false }))
        }
        img.src = url
      } catch {
        setPortraitByUrl((prev) => ({ ...prev, [url]: false }))
      }
    }

    return () => {
      cancelled = true
    }
  }, [experts, portraitByUrl])

  const slotsById = useMemo(() => {
    const m = new Map<string, { startAt: string; endAt: string }>()
    for (const e of experts) {
      for (const s of e.slots || []) m.set(s.id, { startAt: s.startAt, endAt: s.endAt })
    }
    return m
  }, [experts])

  function groupSlots(slots: Array<{ id: string; startAt: string; endAt: string }>) {
    const by = new Map<string, Array<{ id: string; startAt: string; endAt: string }>>()
    for (const s of slots || []) {
      const d = new Date(s.startAt)
      if (Number.isNaN(d.getTime())) continue
      const key = d.toISOString().slice(0, 10)
      const list = by.get(key) || []
      list.push(s)
      by.set(key, list)
    }
    const keys = Array.from(by.keys()).sort()
    return keys.map((k) => ({
      dateKey: k,
      slots: (by.get(k) || []).slice().sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    }))
  }

  async function book(expertId: string, slotId: string) {
    if (!slotId) {
      toast.error(isAr ? "اختر موعدًا أولاً" : "Please select a slot")
      return
    }

    const info = requesterInfo[expertId]
    if (!info?.name?.trim()) {
      toast.error(isAr ? "اكتب الاسم" : "Enter name")
      return
    }
    if (!info?.email?.trim()) {
      toast.error(isAr ? "اكتب البريد الإلكتروني" : "Enter email")
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch("/api/consultations/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          requesterName: info.name,
          requesterEmail: info.email,
          requesterPhone: info.phone,
          notes: notes[expertId] || "",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")

      toast.success(isAr ? "تم إرسال طلب الاستشارة" : "Consultation request sent")
      setBookingOpenFor(null)
      setSelectedSlotId((s) => ({ ...s, [expertId]: "" }))
      setSelectedDateKey((s) => ({ ...s, [expertId]: "" }))
      setNotes((n) => ({ ...n, [expertId]: "" }))

      const res2 = await fetch("/api/consultations", { cache: "no-store" })
      const data2 = await res2.json()
      setExperts(data2.experts || [])
    } catch (e: any) {
      toast.error(e?.message || (isAr ? "فشل الحجز" : "Booking failed"))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-muted/50 overflow-hidden">
            <CardContent className="p-6 space-y-4 animate-pulse">
              <div className="h-40 bg-muted rounded-lg" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-9 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (experts.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="text-muted-foreground">{isAr ? "لا توجد استشارات متاحة حاليًا" : "No consultations available right now"}</p>
      </Card>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" dir={isAr ? "rtl" : "ltr"}>
      {experts.map((e) => {
        const displayName = isAr ? e.nameAr : e.nameEn
        const displayField = isAr ? e.fieldAr : e.fieldEn
        const hasSlots = (e.slots || []).length > 0
        const slotValue = selectedSlotId[e.id] || ""
        const chosen = slotValue ? slotsById.get(slotValue) : null
        const dateGroups = groupSlots(e.slots || [])
        const dateValue = selectedDateKey[e.id] || ""
        const timesForDate = dateValue ? dateGroups.find((g) => g.dateKey === dateValue)?.slots || [] : []
        const info = requesterInfo[e.id] || { name: "", email: "", phone: "" }
        const isPortrait = e.imageUrl ? portraitByUrl[e.imageUrl] === true : false

        return (
          <Card key={e.id} className="border-muted/50 backdrop-blur-sm bg-background/50 overflow-hidden">
            <div className="relative w-full aspect-square bg-muted">
              {e.imageUrl ? (
                <Image src={e.imageUrl} alt={displayName} fill className="object-cover" unoptimized />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-5xl font-bold text-muted-foreground">
                  {displayName.slice(0, 1)}
                </div>
              )}
            </div>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl">{displayName}</CardTitle>
              <div className="text-sm text-muted-foreground">{displayField}</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-between">
                <Calendar className="h-4 w-4" />
                <span className="flex-1">{isAr ? "مواعيد متاحة" : "Available slots"}</span>
                <span className="tabular-nums">{e.slots?.length || 0}</span>
              </div>

              <Dialog
                open={bookingOpenFor === e.id}
                onOpenChange={(open) => {
                  setBookingOpenFor(open ? e.id : null)
                  if (open) {
                    setRequesterInfo((prev) => {
                      if (prev[e.id]) return prev
                      const u: any = user || {}
                      return {
                        ...prev,
                        [e.id]: {
                          name: String(u?.name || ""),
                          email: String(u?.email || ""),
                          phone: String(u?.phoneNumber || u?.phone || ""),
                        },
                      }
                    })
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={!hasSlots}>
                    {hasSlots ? (isAr ? "حجز استشارة" : "Book consultation") : isAr ? "لا يوجد مواعيد" : "No slots"}
                  </Button>
                </DialogTrigger>
                <DialogContent dir={isAr ? "rtl" : "ltr"}>
                  <DialogHeader>
                    <DialogTitle>{isAr ? "حجز استشارة" : "Book a consultation"}</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="md:col-span-1">
                        <Label>{isAr ? "الاسم" : "Name"}</Label>
                        <Input
                          value={info.name}
                          onChange={(ev) => setRequesterInfo((s) => ({ ...s, [e.id]: { ...info, name: ev.target.value } }))}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                        <Input
                          type="email"
                          value={info.email}
                          onChange={(ev) => setRequesterInfo((s) => ({ ...s, [e.id]: { ...info, email: ev.target.value } }))}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Label>{isAr ? "رقم الجوال" : "Phone"}</Label>
                        <Input
                          value={info.phone}
                          onChange={(ev) => setRequesterInfo((s) => ({ ...s, [e.id]: { ...info, phone: ev.target.value } }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>{isAr ? "اختر التاريخ" : "Select date"}</Label>
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                              <TableHead className="w-[120px] text-end tabular-nums">{isAr ? "الأوقات" : "Times"}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dateGroups.map((g) => {
                              const d = new Date(`${g.dateKey}T00:00:00`)
                              const label = d.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                              })
                              const active = dateValue === g.dateKey
                              return (
                                <TableRow
                                  key={g.dateKey}
                                  className={active ? "bg-primary/5" : ""}
                                  onClick={() => {
                                    setSelectedDateKey((s) => ({ ...s, [e.id]: g.dateKey }))
                                    setSelectedSlotId((s) => ({ ...s, [e.id]: "" }))
                                  }}
                                >
                                  <TableCell className="font-medium cursor-pointer">{label}</TableCell>
                                  <TableCell className="text-end text-muted-foreground cursor-pointer tabular-nums">{g.slots.length}</TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {dateValue ? (
                      <div className="space-y-2">
                        <Label>{isAr ? "اختر الوقت" : "Select time"}</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {timesForDate.map((s) => {
                            const start = new Date(s.startAt)
                            const end = new Date(s.endAt)
                            const label = `${start.toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString(
                              isAr ? "ar-SA" : "en-US",
                              { hour: "2-digit", minute: "2-digit" },
                            )}`
                            const active = slotValue === s.id
                            return (
                              <Button
                                key={s.id}
                                type="button"
                                variant={active ? "default" : "outline"}
                                className={active ? "" : "bg-transparent"}
                                onClick={() => setSelectedSlotId((st) => ({ ...st, [e.id]: s.id }))}
                              >
                                <span dir="ltr" className="tabular-nums">
                                  {label}
                                </span>
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}

                    {chosen ? (
                      <div className="rounded-lg border p-3 text-sm text-muted-foreground flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5" />
                        <div>
                          <div className="font-medium text-foreground">{displayName}</div>
                          <div dir="ltr" className="tabular-nums">
                            {new Date(chosen.startAt).toLocaleString(isAr ? "ar-SA" : "en-US")} —{" "}
                            {new Date(chosen.endAt).toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <Label>{isAr ? "ملاحظة (اختياري)" : "Note (optional)"}</Label>
                      <Textarea value={notes[e.id] || ""} onChange={(ev) => setNotes((n) => ({ ...n, [e.id]: ev.target.value }))} />
                    </div>

                    <Button className="w-full" onClick={() => book(e.id, slotValue)} disabled={submitting || !slotValue}>
                      {submitting ? (isAr ? "جارٍ الإرسال..." : "Submitting...") : isAr ? "تأكيد الحجز" : "Confirm booking"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
