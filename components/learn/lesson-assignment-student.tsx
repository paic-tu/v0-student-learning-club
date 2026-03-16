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
  attachments?: Array<{ url: string; name: string; size?: number; mimeType?: string }> | null
  submittedAt: string | Date
  status: string
}

export function LessonAssignmentStudent(props: {
  lang: string
  lessonId: string
  maxBytes: number
  allowedMimeTypes?: string[]
  allowText?: boolean
  allowFiles?: boolean
  maxFiles?: number
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
    const allowText = props.allowText !== false
    const allowFiles = props.allowFiles !== false
    const maxFiles = Math.min(10, Math.max(1, Number(props.maxFiles || 1)))

    const files = Array.from(fileRef.current?.files || []).slice(0, allowFiles ? maxFiles : 0)
    const hasText = allowText ? Boolean(textContent.trim()) : false
    const hasFiles = allowFiles ? files.length > 0 : false

    if (!hasText && !hasFiles) {
      toast.error(isAr ? "اكتب إجابة أو ارفع ملفات" : "Enter an answer or upload files")
      return
    }
    for (const f of files) {
      if (f.size > props.maxBytes) {
        toast.error(isAr ? "حجم الملف أكبر من المسموح" : "File is too large")
        return
      }
      if (props.allowedMimeTypes && props.allowedMimeTypes.length > 0 && !props.allowedMimeTypes.includes(f.type)) {
        toast.error(isAr ? "نوع الملف غير مسموح" : "File type not allowed")
        return
      }
    }

    startTransition(async () => {
      try {
        const attachments: Array<{ url: string; name: string; size?: number; mimeType?: string }> = []
        for (const f of files) {
          const fd = new FormData()
          fd.append("file", f)

          const up = await fetch("/api/upload", { method: "POST", body: fd })
          const upBody = await up.json().catch(() => null)
          if (!up.ok) throw new Error(upBody?.error || "Upload failed")

          const url = String(upBody?.url || "")
          if (!url) throw new Error("Upload failed")
          attachments.push({
            url,
            name: f.name,
            size: f.size,
            mimeType: f.type || "application/octet-stream",
          })
        }

        const res = await fetch(`/api/student/lessons/${encodeURIComponent(props.lessonId)}/assignment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            textContent: allowText ? textContent.trim() || null : null,
            attachments: attachments.length > 0 ? attachments : null,
          }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Submit failed")

        setSubmission({
          textContent: allowText ? textContent.trim() || null : null,
          attachments: attachments.length > 0 ? attachments : null,
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
      {props.allowText !== false && (
        <div className="space-y-2">
          <Label>{isAr ? "الإجابة" : "Answer"}</Label>
          <Textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} disabled={isPending} rows={5} />
        </div>
      )}
      {props.allowFiles !== false && (
        <div className="space-y-2">
          <Label>{isAr ? "إرفاق ملفات (اختياري)" : "Attach files (optional)"}</Label>
          <Input ref={fileRef} type="file" disabled={isPending} multiple={Math.min(10, Math.max(1, Number(props.maxFiles || 1))) > 1} />
          <div className="text-xs text-muted-foreground">
            {isAr ? "الحد الأقصى لكل ملف:" : "Max per file:"} {Math.round(props.maxBytes / 1024 / 1024)}MB
            {Number(props.maxFiles || 1) > 1 ? <span> • {isAr ? "عدد الملفات:" : "Files:"} {Math.min(10, Math.max(1, Number(props.maxFiles || 1)))}</span> : null}
            {props.allowedMimeTypes && props.allowedMimeTypes.length > 0 ? (
              <span>
                {" "}
                • {isAr ? "الأنواع:" : "Types:"} {props.allowedMimeTypes.join(", ")}
              </span>
            ) : null}
          </div>
        </div>
      )}
      <Button type="button" onClick={uploadAndSubmit} disabled={isPending}>
        {isPending ? (isAr ? "جاري الإرسال..." : "Submitting...") : isAr ? "تسليم" : "Submit"}
      </Button>
      {submission && (
        <div className="text-sm space-y-1">
          {Array.isArray(submission.attachments) && submission.attachments.length > 0 ? (
            <div className="space-y-1">
              <div className="text-muted-foreground">{isAr ? "الملفات:" : "Files:"}</div>
              <div className="space-y-1">
                {submission.attachments.map((a, idx) => (
                  <div key={`${a.url}-${idx}`}>
                    <a className="underline" href={a.url} target="_blank" rel="noreferrer">
                      {a.name}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : submission.fileUrl && submission.fileName && submission.fileSize ? (
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
