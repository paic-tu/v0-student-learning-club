"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function AssignmentSubmitForm(props: {
  lang: string
  assignmentId: string
  maxBytes: number
  existingFileUrl?: string | null
}) {
  const isAr = props.lang === "ar"
  const [fileUrl, setFileUrl] = useState(props.existingFileUrl || "")
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const upload = () => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error(isAr ? "اختر ملفًا" : "Select a file")
      return
    }
    if (file.size > props.maxBytes) {
      toast.error(isAr ? "حجم الملف أكبر من المسموح" : "File is too large")
      return
    }

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append("file", file)

        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Upload failed")

        const url = String(body?.url || "")
        if (!url) throw new Error("Upload failed")

        const res2 = await fetch(`/api/student/assignments/${encodeURIComponent(props.assignmentId)}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileUrl: url,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
          }),
        })
        const body2 = await res2.json().catch(() => null)
        if (!res2.ok) throw new Error(body2?.error || "Submit failed")

        setFileUrl(url)
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
        <Label>{isAr ? "رفع ملف التسليم" : "Upload submission file"}</Label>
        <Input ref={fileRef} type="file" disabled={isPending} />
        <div className="text-xs text-muted-foreground">
          {isAr ? "الحد الأقصى 500MB." : "Max 500MB."}
        </div>
      </div>
      <Button onClick={upload} disabled={isPending}>
        {isPending ? (isAr ? "جاري الرفع..." : "Uploading...") : isAr ? "تسليم الواجب" : "Submit assignment"}
      </Button>
      {fileUrl && (
        <div className="text-sm">
          <a className="underline" href={fileUrl} target="_blank" rel="noreferrer">
            {isAr ? "عرض الملف المرفوع" : "View uploaded file"}
          </a>
        </div>
      )}
    </div>
  )
}

