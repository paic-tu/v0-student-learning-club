"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function StreamPayTestCheckout({ lang }: { lang: string }) {
  const isAr = lang === "ar"
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onTest = () => {
    setCheckoutUrl(null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/stream/test-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, lang }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed to create payment link")
        setCheckoutUrl(body.checkoutUrl)
        toast.success(isAr ? "تم إنشاء رابط الدفع" : "Payment link created")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : isAr ? "فشل إنشاء رابط الدفع" : "Failed")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "اختبار إنشاء رابط دفع" : "Test Create Payment Link"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stream-test-name">{isAr ? "الاسم" : "Name"}</Label>
            <Input id="stream-test-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stream-test-phone">{isAr ? "رقم الجوال" : "Phone"}</Label>
            <Input id="stream-test-phone" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          </div>
        </div>

        <Button onClick={onTest} disabled={isPending || !name.trim() || !phone.trim()}>
          {isPending ? (isAr ? "جاري الإنشاء..." : "Creating...") : isAr ? "إنشاء رابط دفع" : "Create Payment Link"}
        </Button>

        {checkoutUrl && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">{isAr ? "رابط الدفع" : "Checkout URL"}</div>
            <div className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs break-all">{checkoutUrl}</div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(checkoutUrl)
                  toast.success(isAr ? "تم النسخ" : "Copied")
                }}
              >
                {isAr ? "نسخ الرابط" : "Copy"}
              </Button>
              <Button asChild>
                <a href={checkoutUrl} target="_blank" rel="noreferrer">
                  {isAr ? "فتح الدفع" : "Open checkout"}
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

