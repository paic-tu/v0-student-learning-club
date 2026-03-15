"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type Submission = {
  textContent?: string | null
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  mimeType?: string | null
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
  const [textContent, setTextContent] = useState("")
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true
    fetch(`/api/student/lessons/${encodeURIComponent(props.lessonId)}/assignment`)
      .then((r) => r.json().then((b) => ({ ok: r.ok, b })))
      .then(({ ok, b }) => {
        if (!mounted) return
        if (ok) {
          setSubmission(b?.submission || null)
          setTextContent(String(b?.submission?.textContent || ""))
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [props.lessonId])

  const uploadAndSubmit = () => {
    const file = fileRef.current?.files?.[0]
    const hasText = Boolean(textContent.trim())
    const hasFile = Boolean(file)
    if (!hasText && !hasFile) {
      toast.error(isAr ? "اكتب نصًا أو ارفع ملفًا" : "Enter text or upload a file")
      return
    }
    if (file && file.size > props.maxBytes) {
      toast.error(isAr ? "حجم الملف أكبر من المسموح" : "File is too large")
      return
    }
    if (file && props.allowedMimeTypes && props.allowedMimeTypes.length > 0 && !props.allowedMimeTypes.includes(file.type)) {
      toast.error(isAr ? "نوع الملف غير مسموح" : "File type not allowed")
      return
    }

    startTransition(async () => {
      try {
        let fileUrl = ""
        if (file) {
          const fd = new FormData()
          fd.append("file", file)

          const up = await fetch("/api/upload", { method: "POST", body: fd })
          const upBody = await up.json().catch(() => null)
          if (!up.ok) throw new Error(upBody?.error || "Upload failed")

          fileUrl = String(upBody?.url || "")
          if (!fileUrl) throw new Error("Upload failed")
        }

        const res = await fetch(`/api/student/lessons/${encodeURIComponent(props.lessonId)}/assignment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            textContent: textContent.trim() || null,
            ...(fileUrl
              ? {
                  fileUrl,
                  fileName: file?.name,
                  fileSize: file?.size,
                  mimeType: file?.type || "application/octet-stream",
                }
              : {}),
          }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Submit failed")

        setSubmission({
          textContent: textContent.trim() || null,
          fileUrl: fileUrl || null,
          fileName: file?.name || null,
          fileSize: file?.size || null,
          mimeType: file?.type || null,
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
        <Label>{isAr ? "تسليم نصي (اختياري)" : "Text submission (optional)"}</Label>
        <Textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} disabled={isPending} rows={5} />
      </div>
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
      <Button type="button" onClick={uploadAndSubmit} disabled={isPending}>
        {isPending ? (isAr ? "جاري الإرسال..." : "Submitting...") : isAr ? "تسليم" : "Submit"}
      </Button>
      {submission && (
        <div className="text-sm space-y-1">
          {submission.fileUrl && submission.fileName && submission.fileSize ? (
            <>
              <div className="text-muted-foreground">
                {isAr ? "آخر ملف:" : "Last file:"} {Math.round(Number(submission.fileSize) / 1024 / 1024)} MB
              </div>
              <a className="underline" href={submission.fileUrl} target="_blank" rel="noreferrer">
                {submission.fileName}
              </a>
            </>
          ) : null}
          {submission.textContent && (
            <div className="text-muted-foreground whitespace-pre-wrap">{submission.textContent}</div>
          )}
        </div>
      )}
    </div>
  )
}
