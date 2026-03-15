"use client"

import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { StreamPayEndpoint } from "@/lib/admin/stream-pay-endpoints"

function extractParams(template: string) {
  const matches = template.matchAll(/\{([a-zA-Z0-9_]+)\}/g)
  const params: string[] = []
  for (const m of matches) params.push(m[1])
  return Array.from(new Set(params))
}

export function StreamPayApiRunner(props: { lang: string; endpoint: StreamPayEndpoint; specText?: string }) {
  const isAr = props.lang === "ar"
  const params = useMemo(() => extractParams(props.endpoint.path), [props.endpoint.path])
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => Object.fromEntries(params.map((p) => [p, ""])))
  const [queryString, setQueryString] = useState("")
  const [bodyText, setBodyText] = useState(() =>
    props.endpoint.defaultBody ? JSON.stringify(props.endpoint.defaultBody, null, 2) : "{\n}\n",
  )
  const [resultText, setResultText] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const resolvedPath = useMemo(() => {
    let p = props.endpoint.path
    for (const key of params) {
      const value = (paramValues[key] || "").trim()
      p = p.replaceAll(`{${key}}`, value || `{${key}}`)
    }
    return p
  }, [props.endpoint.path, params, paramValues])

  const run = () => {
    startTransition(async () => {
      try {
        if (resolvedPath.includes("{")) {
          throw new Error(isAr ? "املأ كل حقول path مثل id" : "Fill all path params like id")
        }

        const query: Record<string, string> = {}
        if (queryString.trim()) {
          for (const part of queryString.split("&")) {
            const [k, v] = part.split("=")
            if (!k) continue
            query[decodeURIComponent(k.trim())] = decodeURIComponent((v || "").trim())
          }
        }

        let body: any = undefined
        if (!["GET", "DELETE"].includes(props.endpoint.method)) {
          try {
            body = bodyText.trim() ? JSON.parse(bodyText) : {}
          } catch {
            throw new Error(isAr ? "JSON غير صالح في Body" : "Invalid JSON body")
          }
        }

        const res = await fetch("/api/admin/stream/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: props.endpoint.method,
            path: resolvedPath,
            query,
            body,
          }),
        })

        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || "Request failed")

        setResultText(JSON.stringify(data.data, null, 2))
        toast.success(isAr ? "تم التنفيذ" : "Executed")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : isAr ? "فشل التنفيذ" : "Failed")
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "تنفيذ العملية" : "Run Operation"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "Method" : "Method"}</Label>
              <div className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs">{props.endpoint.method}</div>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "Path" : "Path"}</Label>
              <div className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs break-all">{resolvedPath}</div>
            </div>
          </div>

          {params.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {params.map((p) => (
                <div className="space-y-2" key={p}>
                  <Label htmlFor={`param-${p}`}>{p}</Label>
                  <Input
                    id={`param-${p}`}
                    value={paramValues[p] || ""}
                    onChange={(e) => setParamValues((prev) => ({ ...prev, [p]: e.target.value }))}
                    dir="ltr"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="query">{isAr ? "Query (اختياري)" : "Query (optional)"}</Label>
            <Input
              id="query"
              value={queryString}
              onChange={(e) => setQueryString(e.target.value)}
              placeholder="limit=20&offset=0"
              dir="ltr"
            />
          </div>

          {!["GET", "DELETE"].includes(props.endpoint.method) && (
            <div className="space-y-2">
              <Label htmlFor="body">Body (JSON)</Label>
              <Textarea id="body" value={bodyText} onChange={(e) => setBodyText(e.target.value)} className="min-h-[220px] font-mono text-xs" dir="ltr" />
            </div>
          )}

          <Button onClick={run} disabled={isPending}>
            {isPending ? (isAr ? "جاري التنفيذ..." : "Running...") : isAr ? "تنفيذ" : "Run"}
          </Button>
        </CardContent>
      </Card>

      {resultText && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{isAr ? "النتيجة" : "Result"}</CardTitle>
            <Button
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(resultText)
                toast.success(isAr ? "تم النسخ" : "Copied")
              }}
            >
              {isAr ? "نسخ" : "Copy"}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[520px] overflow-auto rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">{resultText}</pre>
          </CardContent>
        </Card>
      )}

      {props.specText && (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "المواصفات" : "Spec"}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[520px] overflow-auto rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">{props.specText}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

