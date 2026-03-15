"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type Submission = {
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  submittedAt: string | Date
  status: string
}

export function LessonAssignmentStudent(props: {
  lang: string
  lessonId: string
  maxBytes: number
  allowedMimeTypes?: string[]
}) {
  const isAr = props.lang === "ar"
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true
    fetch(`/api/student/lessons/${encodeURIComponent(props.lessonId)}/assignment`)
      .then((r) => r.json().then((b) => ({ ok: r.ok, b })))
      .then(({ ok, b }) => {
        if (!mounted) return
        if (ok) setSubmission(b?.submission || null)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [props.lessonId])

  const uploadAndSubmit = () => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error(isAr ? "اختر ملفًا" : "Select a file")
      return
    }
    if (file.size > props.maxBytes) {
      toast.error(isAr ? "حجم الملف أكبر من المسموح" : "File is too large")
      return
    }
    if (props.allowedMimeTypes && props.allowedMimeTypes.length > 0 && !props.allowedMimeTypes.includes(file.type)) {
      toast.error(isAr ? "نوع الملف غير مسموح" : "File type not allowed")
      return
    }

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append("file", file)

        const up = await fetch("/api/upload", { method: "POST", body: fd })
        const upBody = await up.json().catch(() => null)
        if (!up.ok) throw new Error(upBody?.error || "Upload failed")

        const fileUrl = String(upBody?.url || "")
        if (!fileUrl) throw new Error("Upload failed")

        const res = await fetch(`/api/student/lessons/${encodeURIComponent(props.lessonId)}/assignment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileUrl,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
          }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Submit failed")

        setSubmission({
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          submittedAt: new Date().toISOString(),
          status: "submitted",
        })
        toast.success(isAr ? "تم التسليم" : "Submitted")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      } finally {
        if (fileRef.current) fileRef.current.value = ""
      }
    })
  }

  return (
    <div className="space-y-3" dir={isAr ? "rtl" : "ltr"}>
      <div className="space-y-2">
        <Label>{isAr ? "تسليم الواجب" : "Assignment submission"}</Label>
        <Input ref={fileRef} type="file" disabled={isPending} />
        <div className="text-xs text-muted-foreground">
          {isAr ? "الحد الأقصى:" : "Max:"} {Math.round(props.maxBytes / 1024 / 1024)}MB
          {props.allowedMimeTypes && props.allowedMimeTypes.length > 0 ? (
            <span>
              {" "}
              • {isAr ? "الأنواع:" : "Types:"} {props.allowedMimeTypes.join(", ")}
            </span>
          ) : null}
        </div>
      </div>
      <Button onClick={uploadAndSubmit} disabled={isPending}>
        {isPending ? (isAr ? "جاري الرفع..." : "Uploading...") : isAr ? "رفع وتسليم" : "Upload & Submit"}
      </Button>
      {submission && (
        <div className="text-sm space-y-1">
          <div className="text-muted-foreground">
            {isAr ? "آخر تسليم:" : "Last submission:"} {Math.round(submission.fileSize / 1024 / 1024)} MB
          </div>
          <a className="underline" href={submission.fileUrl} target="_blank" rel="noreferrer">
            {submission.fileName}
          </a>
        </div>
      )}
    </div>
  )
}

