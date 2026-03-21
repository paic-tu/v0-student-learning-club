"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/image-upload"

type Expert = {
  id: string
  userId: string | null
  nameEn: string
  nameAr: string
  fieldEn: string
  fieldAr: string
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
}

type Slot = {
  id: string
  expertId: string
  startAt: string
  endAt: string
  status: "available" | "booked" | "cancelled"
}

export function ConsultationsScheduleManager({
  lang,
  initialExperts,
  initialSlots,
}: {
  lang: string
  initialExperts: Expert[]
  initialSlots: Slot[]
}) {
  const isAr = lang === "ar"
  const [experts, setExperts] = useState<Expert[]>(initialExperts)
  const [slots, setSlots] = useState<Slot[]>(initialSlots)
  const [saving, setSaving] = useState(false)

  const expertOptions = useMemo(() => experts.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [experts])

  const [newExpert, setNewExpert] = useState({
    userId: "",
    nameEn: "",
    nameAr: "",
    fieldEn: "",
    fieldAr: "",
    imageUrl: "",
    sortOrder: 0,
    isActive: true,
  })
  const [editingExpertId, setEditingExpertId] = useState<string | null>(null)
  const [eligibleUsers, setEligibleUsers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([])
  const [eligibleQuery, setEligibleQuery] = useState("")

  const [newSlot, setNewSlot] = useState({
    expertId: expertOptions[0]?.id || "",
    startAt: "",
    endAt: "",
  })

  const weekdayLabels = isAr
    ? ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const [weekConfig, setWeekConfig] = useState(() => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const dd = String(today.getDate()).padStart(2, "0")
    return {
      expertId: expertOptions[0]?.id || "",
      startDate: `${yyyy}-${mm}-${dd}`,
      startTime: "16:00",
      endTime: "17:00",
      days: Array.from({ length: 7 }, (_, i) => ({
        dayIndex: i,
        enabled: i !== 5,
        startTime: "16:00",
        endTime: "17:00",
      })),
    }
  })

  async function refresh() {
    const [expertsRes, slotsRes] = await Promise.all([
      fetch("/api/admin/consultations/experts", { cache: "no-store" }),
      fetch("/api/admin/consultations/slots", { cache: "no-store" }),
    ])
    const expertsData = await expertsRes.json()
    const slotsData = await slotsRes.json()
    setExperts(expertsData.experts || [])
    setSlots(slotsData.slots || [])
  }

  useEffect(() => {
    let cancelled = false
    async function loadEligible() {
      try {
        const url = eligibleQuery.trim()
          ? `/api/admin/consultations/eligible-users?q=${encodeURIComponent(eligibleQuery.trim())}`
          : "/api/admin/consultations/eligible-users"
        const res = await fetch(url, { cache: "no-store" })
        const data = await res.json()
        if (cancelled) return
        setEligibleUsers(data.users || [])
      } catch {
        if (cancelled) return
        setEligibleUsers([])
      }
    }
    loadEligible()
    return () => {
      cancelled = true
    }
  }, [eligibleQuery])

  async function createDemo() {
    try {
      setSaving(true)
      const res = await fetch("/api/admin/consultations/demo", { method: "POST" })
      if (!res.ok) throw new Error("failed")
      await refresh()
      toast.success(isAr ? "تم إنشاء ديمو الاستشارات" : "Consultations demo created")
    } catch {
      toast.error(isAr ? "فشل إنشاء الديمو" : "Failed to create demo")
    } finally {
      setSaving(false)
    }
  }

  async function saveExpert() {
    try {
      setSaving(true)
      const url = editingExpertId ? `/api/admin/consultations/experts/${editingExpertId}` : "/api/admin/consultations/experts"
      const method = editingExpertId ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(newExpert) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "failed")
      setNewExpert({ userId: "", nameEn: "", nameAr: "", fieldEn: "", fieldAr: "", imageUrl: "", sortOrder: 0, isActive: true })
      setEditingExpertId(null)
      await refresh()
      toast.success(isAr ? "تم حفظ المستشار" : "Expert saved")
    } catch (e: any) {
      toast.error(e?.message || (isAr ? "فشل حفظ المستشار" : "Failed to save expert"))
    } finally {
      setSaving(false)
    }
  }

  async function deleteExpert(id: string) {
    if (!confirm(isAr ? "حذف المستشار؟" : "Delete expert?")) return
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/consultations/experts/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("failed")
      await refresh()
      toast.success(isAr ? "تم حذف المستشار" : "Expert deleted")
    } catch {
      toast.error(isAr ? "فشل حذف المستشار" : "Failed to delete expert")
    } finally {
      setSaving(false)
    }
  }

  async function createSlot() {
    try {
      setSaving(true)
      const res = await fetch("/api/admin/consultations/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSlot),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "failed")
      setNewSlot((s) => ({ ...s, startAt: "", endAt: "" }))
      await refresh()
      toast.success(isAr ? "تم إضافة الموعد" : "Slot created")
    } catch (e: any) {
      toast.error(e?.message || (isAr ? "فشل إضافة الموعد" : "Failed to create slot"))
    } finally {
      setSaving(false)
    }
  }

  async function deleteSlot(id: string) {
    if (!confirm(isAr ? "حذف الموعد؟" : "Delete slot?")) return
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/consultations/slots/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("failed")
      await refresh()
      toast.success(isAr ? "تم حذف الموعد" : "Slot deleted")
    } catch {
      toast.error(isAr ? "فشل حذف الموعد" : "Failed to delete slot")
    } finally {
      setSaving(false)
    }
  }

  const weekRows = useMemo(() => {
    const base = new Date(`${weekConfig.startDate}T00:00:00`)
    if (Number.isNaN(base.getTime())) return []
    return Array.from({ length: 7 }, (_, offset) => {
      const d = new Date(base)
      d.setDate(d.getDate() + offset)
      const weekday = d.getDay()
      return {
        offset,
        dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        weekday,
      }
    })
  }, [weekConfig.startDate])

  async function createWeekSlots() {
    try {
      setSaving(true)
      const slotsPayload = weekRows
        .map((r) => {
          const dayCfg = weekConfig.days.find((d) => d.dayIndex === r.weekday)
          if (!dayCfg?.enabled) return null
          const startAt = `${r.dateKey}T${dayCfg.startTime}:00`
          const endAt = `${r.dateKey}T${dayCfg.endTime}:00`
          return { expertId: weekConfig.expertId, startAt, endAt }
        })
        .filter(Boolean)

      if (slotsPayload.length === 0) {
        toast.error(isAr ? "اختر أيامًا أولاً" : "Select days first")
        return
      }

      const res = await fetch("/api/admin/consultations/slots/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: slotsPayload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "failed")
      await refresh()
      toast.success(isAr ? "تمت إضافة مواعيد الأسبوع" : "Week slots created")
    } catch (e: any) {
      toast.error(e?.message || (isAr ? "فشل إضافة المواعيد" : "Failed to create slots"))
    } finally {
      setSaving(false)
    }
  }

  const expertsById = useMemo(() => new Map(experts.map((e) => [e.id, e])), [experts])
  const upcomingSlots = useMemo(() => {
    const now = Date.now()
    return slots
      .filter((s) => new Date(s.startAt).getTime() >= now - 24 * 60 * 60 * 1000)
      .slice()
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }, [slots])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={createDemo} disabled={saving}>
          {isAr ? "إنشاء ديمو" : "Create demo"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "بطاقات الاستشارات" : "Consultation Cards"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>{isAr ? "ربط بحساب (مدرس/أدمن)" : "Link user (Instructor/Admin)"}</Label>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <Input
                  placeholder={isAr ? "بحث بالاسم أو الإيميل..." : "Search by name or email..."}
                  value={eligibleQuery}
                  onChange={(e) => setEligibleQuery(e.target.value)}
                />
                <Select value={newExpert.userId || "none"} onValueChange={(v) => setNewExpert({ ...newExpert, userId: v === "none" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={isAr ? "اختر مستخدم" : "Select user"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{isAr ? "بدون" : "None"}</SelectItem>
                    {eligibleUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{isAr ? "الاسم (عربي)" : "Name (AR)"}</Label>
              <Input value={newExpert.nameAr} onChange={(e) => setNewExpert({ ...newExpert, nameAr: e.target.value })} />
            </div>
            <div>
              <Label>{isAr ? "الاسم (إنجليزي)" : "Name (EN)"}</Label>
              <Input value={newExpert.nameEn} onChange={(e) => setNewExpert({ ...newExpert, nameEn: e.target.value })} />
            </div>
            <div>
              <Label>{isAr ? "المجال (عربي)" : "Field (AR)"}</Label>
              <Input value={newExpert.fieldAr} onChange={(e) => setNewExpert({ ...newExpert, fieldAr: e.target.value })} />
            </div>
            <div>
              <Label>{isAr ? "المجال (إنجليزي)" : "Field (EN)"}</Label>
              <Input value={newExpert.fieldEn} onChange={(e) => setNewExpert({ ...newExpert, fieldEn: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>{isAr ? "الصورة" : "Image"}</Label>
              <div className="mt-2">
                <ImageUpload
                  value={newExpert.imageUrl}
                  onChange={(url) => setNewExpert({ ...newExpert, imageUrl: url })}
                  disabled={saving}
                  shape="rect"
                  aspect={1}
                  label={isAr ? "رفع صورة" : "Upload image"}
                />
              </div>
            </div>
            <div>
              <Label>{isAr ? "الترتيب" : "Sort order"}</Label>
              <Input
                type="number"
                value={newExpert.sortOrder}
                onChange={(e) => setNewExpert({ ...newExpert, sortOrder: Number.parseInt(e.target.value || "0", 10) })}
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2 pb-2">
                <Checkbox
                  checked={newExpert.isActive}
                  onCheckedChange={(v) => setNewExpert({ ...newExpert, isActive: Boolean(v) })}
                />
                <span className="text-sm">{isAr ? "مفعّل" : "Active"}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="flex gap-2">
              {editingExpertId ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingExpertId(null)
                    setNewExpert({ userId: "", nameEn: "", nameAr: "", fieldEn: "", fieldAr: "", imageUrl: "", sortOrder: 0, isActive: true })
                  }}
                  disabled={saving}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
              ) : null}
              <Button onClick={saveExpert} disabled={saving}>
                {editingExpertId ? (isAr ? "حفظ" : "Save") : isAr ? "إضافة" : "Add"}
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                <TableHead>{isAr ? "المجال" : "Field"}</TableHead>
                <TableHead>{isAr ? "مفعّل" : "Active"}</TableHead>
                <TableHead>{isAr ? "الترتيب" : "Order"}</TableHead>
                <TableHead className="w-[180px]">{isAr ? "إجراء" : "Action"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experts.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{isAr ? e.nameAr : e.nameEn}</TableCell>
                  <TableCell className="text-muted-foreground">{isAr ? e.fieldAr : e.fieldEn}</TableCell>
                  <TableCell>{e.isActive ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}</TableCell>
                  <TableCell>{e.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingExpertId(e.id)
                          setNewExpert({
                            userId: e.userId || "",
                            nameEn: e.nameEn,
                            nameAr: e.nameAr,
                            fieldEn: e.fieldEn,
                            fieldAr: e.fieldAr,
                            imageUrl: e.imageUrl || "",
                            sortOrder: e.sortOrder || 0,
                            isActive: Boolean(e.isActive),
                          })
                        }}
                        disabled={saving}
                      >
                        {isAr ? "تعديل" : "Edit"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteExpert(e.id)} disabled={saving}>
                        {isAr ? "حذف" : "Delete"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {experts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    {isAr ? "لا يوجد مستشارين" : "No experts"}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "مواعيد الاستشارات" : "Consultation Slots"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-4">
            <div className="font-semibold">{isAr ? "إضافة أسبوع (نفس الوقت لكل الأيام مع إمكانية التعديل)" : "Add a week (same time, editable per day)"}</div>
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <Label>{isAr ? "المستشار" : "Expert"}</Label>
                <Select value={weekConfig.expertId} onValueChange={(v) => setWeekConfig((s: any) => ({ ...s, expertId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={isAr ? "اختر" : "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {expertOptions.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {isAr ? e.nameAr : e.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "بداية الأسبوع" : "Week start"}</Label>
                <Input type="date" value={weekConfig.startDate} onChange={(e) => setWeekConfig((s: any) => ({ ...s, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "وقت افتراضي (بداية)" : "Default start"}</Label>
                <Input
                  type="time"
                  value={weekConfig.startTime}
                  onChange={(e) =>
                    setWeekConfig((s: any) => ({
                      ...s,
                      startTime: e.target.value,
                      days: s.days.map((d: any) => ({ ...d, startTime: e.target.value })),
                    }))
                  }
                />
              </div>
              <div>
                <Label>{isAr ? "وقت افتراضي (نهاية)" : "Default end"}</Label>
                <Input
                  type="time"
                  value={weekConfig.endTime}
                  onChange={(e) =>
                    setWeekConfig((s: any) => ({
                      ...s,
                      endTime: e.target.value,
                      days: s.days.map((d: any) => ({ ...d, endTime: e.target.value })),
                    }))
                  }
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "اليوم" : "Day"}</TableHead>
                  <TableHead>{isAr ? "تفعيل" : "Enable"}</TableHead>
                  <TableHead>{isAr ? "وقت البداية" : "Start"}</TableHead>
                  <TableHead>{isAr ? "وقت النهاية" : "End"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekConfig.days.map((d: any) => (
                  <TableRow key={d.dayIndex}>
                    <TableCell className="font-medium">{weekdayLabels[d.dayIndex]}</TableCell>
                    <TableCell>
                      <Checkbox
                        checked={d.enabled}
                        onCheckedChange={(v) =>
                          setWeekConfig((s: any) => ({
                            ...s,
                            days: s.days.map((x: any) => (x.dayIndex === d.dayIndex ? { ...x, enabled: Boolean(v) } : x)),
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        value={d.startTime}
                        onChange={(e) =>
                          setWeekConfig((s: any) => ({
                            ...s,
                            days: s.days.map((x: any) => (x.dayIndex === d.dayIndex ? { ...x, startTime: e.target.value } : x)),
                          }))
                        }
                        disabled={!d.enabled}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        value={d.endTime}
                        onChange={(e) =>
                          setWeekConfig((s: any) => ({
                            ...s,
                            days: s.days.map((x: any) => (x.dayIndex === d.dayIndex ? { ...x, endTime: e.target.value } : x)),
                          }))
                        }
                        disabled={!d.enabled}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end">
              <Button onClick={createWeekSlots} disabled={saving || !weekConfig.expertId || !weekConfig.startDate}>
                {isAr ? "إضافة الأسبوع" : "Add week"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <Label>{isAr ? "المستشار" : "Expert"}</Label>
              <Select value={newSlot.expertId} onValueChange={(v) => setNewSlot({ ...newSlot, expertId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر" : "Select"} />
                </SelectTrigger>
                <SelectContent>
                  {expertOptions.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {isAr ? e.nameAr : e.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "وقت البداية" : "Start"}</Label>
              <Input type="datetime-local" value={newSlot.startAt} onChange={(e) => setNewSlot({ ...newSlot, startAt: e.target.value })} />
            </div>
            <div>
              <Label>{isAr ? "وقت النهاية" : "End"}</Label>
              <Input type="datetime-local" value={newSlot.endAt} onChange={(e) => setNewSlot({ ...newSlot, endAt: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={createSlot} disabled={saving || !newSlot.expertId || !newSlot.startAt || !newSlot.endAt}>
              {isAr ? "إضافة موعد" : "Add slot"}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "المستشار" : "Expert"}</TableHead>
                <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                <TableHead>{isAr ? "الوقت" : "Time"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead className="w-[120px]">{isAr ? "إجراء" : "Action"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingSlots.map((s) => {
                const e = expertsById.get(s.expertId)
                const start = new Date(s.startAt)
                const end = new Date(s.endAt)
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{e ? (isAr ? e.nameAr : e.nameEn) : s.expertId}</TableCell>
                    <TableCell>{start.toLocaleDateString(isAr ? "ar-SA" : "en-US")}</TableCell>
                    <TableCell>
                      {start.toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })} -{" "}
                      {end.toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell>{s.status}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => deleteSlot(s.id)} disabled={saving}>
                        {isAr ? "حذف" : "Delete"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {upcomingSlots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    {isAr ? "لا يوجد مواعيد" : "No slots"}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
