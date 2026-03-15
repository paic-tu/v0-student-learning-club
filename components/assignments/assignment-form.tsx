"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type CourseOption = { id: string; titleEn: string; titleAr: string }

export function AssignmentForm(props: {
  lang: string
  apiUrl: string
  courses: CourseOption[]
  redirectTo: string
}) {
  const isAr = props.lang === "ar"
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [courseId, setCourseId] = useState("")
  const [titleEn, setTitleEn] = useState("")
  const [titleAr, setTitleAr] = useState("")
  const [descriptionEn, setDescriptionEn] = useState("")
  const [descriptionAr, setDescriptionAr] = useState("")
  const [dueAt, setDueAt] = useState("")
  const [isPublished, setIsPublished] = useState(true)

  const canSubmit = useMemo(() => {
    return Boolean(courseId && titleEn.trim() && titleAr.trim())
  }, [courseId, titleEn, titleAr])

  const submit = () => {
    startTransition(async () => {
      try {
        const res = await fetch(props.apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            titleEn: titleEn.trim(),
            titleAr: titleAr.trim(),
            descriptionEn: descriptionEn.trim() || null,
            descriptionAr: descriptionAr.trim() || null,
            dueAt: dueAt ? new Date(dueAt).toISOString() : null,
            isPublished,
          }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        toast.success(isAr ? "تم إنشاء الواجب" : "Assignment created")
        router.push(props.redirectTo)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{isAr ? "الدورة" : "Course"}</Label>
          <Select value={courseId} onValueChange={setCourseId} disabled={isPending}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={isAr ? "اختر دورة" : "Select course"} />
            </SelectTrigger>
            <SelectContent>
              {props.courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {isAr ? c.titleAr : c.titleEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{isAr ? "تاريخ التسليم (اختياري)" : "Due date (optional)"}</Label>
          <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} disabled={isPending} />
          <div className="text-xs text-muted-foreground">
            {isAr ? "حد رفع الملف 500MB لكل طالب." : "Max file size is 500MB per student."}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
          <Input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label>{isAr ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
          <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} disabled={isPending} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
          <Textarea rows={5} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label>{isAr ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
          <Textarea rows={5} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} disabled={isPending} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox checked={isPublished} onCheckedChange={(v) => setIsPublished(Boolean(v))} disabled={isPending} />
        <div className="text-sm">{isAr ? "منشور للطلاب" : "Published for students"}</div>
      </div>

      <Button onClick={submit} disabled={!canSubmit || isPending}>
        {isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : isAr ? "إنشاء الواجب" : "Create assignment"}
      </Button>
    </div>
  )
}

