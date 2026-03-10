"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export function ContactSheetForm({ lang }: { lang: "ar" | "en" }) {
  const isAr = lang === "ar"
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [company, setCompany] = useState("")

  const canSubmit = useMemo(() => {
    const n = name.trim()
    const e = email.trim()
    const m = message.trim()
    return n.length >= 2 && e.length >= 5 && m.length >= 3
  }, [name, email, message])

  return (
    <Card className="border-primary/10">
      <CardHeader>
        <CardTitle className="text-base">{isAr ? "أرسل رسالة" : "Send a Message"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!canSubmit || loading) return
            setLoading(true)
            try {
              const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  name,
                  email,
                  message,
                  company,
                }),
              })

              if (!res.ok) {
                const data = await res.json().catch(() => null)
                toast({
                  title: isAr ? "تعذر الإرسال" : "Failed to send",
                  description:
                    typeof data?.error === "string"
                      ? `${data.error}${typeof data?.details === "string" && data.details ? `: ${data.details}` : ""}`
                      : isAr
                        ? "حاول مرة أخرى لاحقًا."
                        : "Please try again later.",
                  variant: "destructive",
                })
                return
              }

              setName("")
              setEmail("")
              setMessage("")
              setCompany("")
              toast({
                title: isAr ? "تم الإرسال" : "Sent",
                description: isAr ? "تم استلام رسالتك بنجاح." : "Your message has been received.",
              })
            } finally {
              setLoading(false)
            }
          }}
        >
          <div className="grid gap-2">
            <div className="text-sm font-medium">{isAr ? "الاسم" : "Name"}</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={isAr ? "اسمك" : "Your name"} />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">{isAr ? "البريد الإلكتروني" : "Email"}</div>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isAr ? "example@email.com" : "example@email.com"}
              type="email"
              inputMode="email"
            />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">{isAr ? "الرسالة" : "Message"}</div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isAr ? "اكتب رسالتك هنا..." : "Write your message here..."}
              className="min-h-28"
            />
          </div>

          <div className="hidden">
            <Input value={company} onChange={(e) => setCompany(e.target.value)} tabIndex={-1} aria-hidden="true" />
          </div>

          <Button type="submit" disabled={!canSubmit || loading} className="w-full">
            {loading ? (isAr ? "جاري الإرسال..." : "Sending...") : isAr ? "إرسال" : "Send"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
