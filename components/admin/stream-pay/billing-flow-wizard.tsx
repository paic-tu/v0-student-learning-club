"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

type UserListItem = { id: string; name: string; email: string; role: string }
type UserDetails = {
  id: string
  name: string
  email: string
  phoneNumber?: string | null
  phone?: string | null
  preferences?: any
  streamConsumerId?: string | null
}

type LocalProduct = {
  id: string
  nameEn: string
  nameAr: string
  price: string
  streamProductId?: string | null
  isActive?: boolean
}

function safeJsonParse(input: string) {
  if (!input.trim()) return {}
  return JSON.parse(input)
}

function getWhatsappNumber(phone: string) {
  const raw = String(phone || "").trim()
  if (!raw) return null
  const digits = raw.replace(/\D/g, "")
  if (!digits) return null
  if (raw.startsWith("+")) return digits
  if (digits.startsWith("966")) return digits
  if (digits.length === 10 && digits.startsWith("05")) return `966${digits.slice(1)}`
  if (digits.length === 9 && digits.startsWith("5")) return `966${digits}`
  return digits
}

function buildBillingMessage(input: { customerName: string; orderId: string; amount: string; url: string }) {
  return `مرحباً ${input.customerName}\n\nتم إصدار فاتورة/رابط دفع للطلب ${input.orderId} بقيمة ${input.amount} SAR\n\nالرابط:\n${input.url}`
}

export function BillingFlowWizard({ lang }: { lang: string }) {
  const isAr = lang === "ar"
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [flowError, setFlowError] = useState<string | null>(null)

  const [userSearch, setUserSearch] = useState("")
  const [userResults, setUserResults] = useState<UserListItem[]>([])
  const [userRole, setUserRole] = useState("student")
  const [userLoadError, setUserLoadError] = useState<string | null>(null)
  const [syncLimit, setSyncLimit] = useState("50")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)

  const [products, setProducts] = useState<LocalProduct[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const selectedProduct = useMemo(() => products.find((p) => p.id === selectedProductId) || null, [products, selectedProductId])

  const [newProductNameEn, setNewProductNameEn] = useState("")
  const [newProductNameAr, setNewProductNameAr] = useState("")
  const [newProductPrice, setNewProductPrice] = useState("10.00")

  const [mode, setMode] = useState<"invoice" | "payment_link">("invoice")
  const [quantity, setQuantity] = useState("1")
  const [currency] = useState("SAR")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [customMetadata, setCustomMetadata] = useState("{\n}\n")
  const [sendEmail, setSendEmail] = useState(true)
  const [sendWhatsapp, setSendWhatsapp] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState({
    mada: true,
    visa: true,
    mastercard: true,
    amex: true,
    bank_transfer: true,
    installment: true,
  })

  const [result, setResult] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const preferredLanguage = useMemo(() => {
    const pref = userDetails?.preferences
    const langValue = pref?.preferred_language || pref?.language || pref?.lang
    return typeof langValue === "string" ? langValue : null
  }, [userDetails])

  const phone = useMemo(() => userDetails?.phoneNumber || userDetails?.phone || "", [userDetails])

  const unitPrice = useMemo(() => {
    if (!selectedProduct) return 0
    const n = Number.parseFloat(String(selectedProduct.price))
    return Number.isFinite(n) ? n : 0
  }, [selectedProduct])

  const qty = useMemo(() => {
    const n = Number.parseInt(quantity, 10)
    return Number.isFinite(n) && n > 0 ? n : 0
  }, [quantity])

  const total = useMemo(() => Number((unitPrice * (qty || 0)).toFixed(2)), [unitPrice, qty])

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => {
      const qs = new URLSearchParams()
      qs.set("role", userRole)
      if (userSearch.trim()) qs.set("search", userSearch.trim())
      qs.set("limit", "100")
      setUserLoadError(null)
      fetch(`/api/admin/stream/billing-flow/users?${qs.toString()}`)
        .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          if (!ok) throw new Error(j?.error || "Failed")
          if (!cancelled) setUserResults(j || [])
        })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : "Failed"
          if (!cancelled) {
            setUserLoadError(msg)
            setUserResults([])
          }
          toast.error(msg)
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [userSearch, userRole])

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/store")
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) throw new Error(j?.error || "Failed")
        if (!cancelled) setProducts(j || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => (p.nameEn || "").toLowerCase().includes(q) || (p.nameAr || "").toLowerCase().includes(q) || p.id.includes(q))
  }, [products, productSearch])

  const pickUser = (id: string) => {
    setSelectedUserId(id)
    setUserDetails(null)
    setResult(null)
    setFlowError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/stream/billing-flow/users/${encodeURIComponent(id)}`)
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        setUserDetails(body)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  const ensureConsumer = async () => {
    if (!selectedUserId) throw new Error(isAr ? "اختر عميل أولًا" : "Select customer first")
    const res = await fetch("/api/admin/stream/billing-flow/ensure-consumer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUserId }),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) throw new Error(body?.error || "Failed to ensure consumer")
    const refreshed = await fetch(`/api/admin/stream/billing-flow/users/${encodeURIComponent(selectedUserId)}`)
    const refreshedBody = await refreshed.json().catch(() => null)
    if (refreshed.ok) setUserDetails(refreshedBody)
    return body.streamConsumerId as string
  }

  const syncConsumers = () => {
    startTransition(async () => {
      try {
        setResult(null)
        const limit = Number.parseInt(syncLimit, 10)
        const res = await fetch("/api/admin/stream/billing-flow/sync-consumers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "student", limit: Number.isFinite(limit) ? limit : 50 }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        setResult(body)
        toast.success(isAr ? "تمت مزامنة المشتركين" : "Synced")
        const qs = new URLSearchParams()
        qs.set("role", "student")
        qs.set("limit", "100")
        const listRes = await fetch(`/api/admin/stream/billing-flow/users?${qs.toString()}`)
        const listBody = await listRes.json().catch(() => null)
        if (listRes.ok) setUserResults(listBody || [])
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  const createProduct = () => {
    startTransition(async () => {
      try {
        setResult(null)
        const res = await fetch("/api/admin/stream/billing-flow/create-local-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nameEn: newProductNameEn, nameAr: newProductNameAr, price: newProductPrice }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        const created: LocalProduct = body.product
        setProducts((prev) => [created, ...prev])
        setSelectedProductId(created.id)
        toast.success(isAr ? "تم إنشاء المنتج" : "Product created")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  const nextFromStep1 = () => {
    startTransition(async () => {
      try {
        setFlowError(null)
        if (!selectedUserId || !userDetails) throw new Error(isAr ? "اختر عميل" : "Select customer")
        await ensureConsumer()
        setStep(2)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed"
        setFlowError(msg)
        toast.error(msg)
      }
    })
  }

  const nextFromStep2 = () => {
    startTransition(async () => {
      try {
        if (!selectedProductId) throw new Error(isAr ? "اختر منتج" : "Select product")
        const res = await fetch("/api/admin/stream/billing-flow/ensure-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: selectedProductId }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        const refreshed = await fetch("/api/admin/store")
        const refreshedBody = await refreshed.json().catch(() => null)
        if (refreshed.ok) setProducts(refreshedBody || [])
        setStep(3)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  const nextFromStep3 = () => {
    try {
      if (!qty) throw new Error(isAr ? "الكمية غير صحيحة" : "Invalid quantity")
      safeJsonParse(customMetadata)
      setStep(4)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    }
  }

  const submit = () => {
    startTransition(async () => {
      try {
        setResult(null)
        setFlowError(null)
        if (!selectedUserId || !selectedProductId) throw new Error(isAr ? "البيانات ناقصة" : "Missing data")
        if (!qty) throw new Error(isAr ? "الكمية غير صحيحة" : "Invalid quantity")

        const metadataObj = safeJsonParse(customMetadata)

        const res = await fetch("/api/admin/stream/billing-flow/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUserId,
            productId: selectedProductId,
            quantity: qty,
            currency,
            description: description.trim() || null,
            dueDate: dueDate.trim() || null,
            mode,
            customMetadata: metadataObj,
            paymentMethods: mode === "invoice" ? paymentMethods : null,
          }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || "Failed")
        setResult(body)
        toast.success(isAr ? "تم التنفيذ" : "Done")
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed"
        setFlowError(msg)
        toast.error(msg)
      }
    })
  }

  const share = useMemo(() => {
    if (!result || !userDetails) return null
    const url = String(result?.paymentLink?.url || result?.streamInvoice?.url || "")
    if (!url) return null
    const orderId = String(result?.orderId || "")
    const amount = total.toFixed(2)
    const message = buildBillingMessage({ customerName: userDetails.name, orderId, amount, url })
    const email = userDetails.email
    const whatsappNumber = getWhatsappNumber(phone)
    const mailto = email
      ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Payment - Order ${orderId}`)}&body=${encodeURIComponent(message)}`
      : null
    const whatsapp = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}` : null
    return { url, orderId, amount, message, mailto, whatsapp }
  }, [result, userDetails, phone, total])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "تدفق الفوترة الكامل" : "Full Billing Flow"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant={step === 1 ? "default" : "outline"} onClick={() => setStep(1)} disabled={isPending}>
            {isAr ? "1) العميل" : "1) Customer"}
          </Button>
          <Button variant={step === 2 ? "default" : "outline"} onClick={() => setStep(2)} disabled={isPending || !selectedUserId}>
            {isAr ? "2) المنتج" : "2) Product"}
          </Button>
          <Button variant={step === 3 ? "default" : "outline"} onClick={() => setStep(3)} disabled={isPending || !selectedProductId}>
            {isAr ? "3) الإعدادات" : "3) Configure"}
          </Button>
          <Button variant={step === 4 ? "default" : "outline"} onClick={() => setStep(4)} disabled={isPending}>
            {isAr ? "4) مراجعة" : "4) Review"}
          </Button>
        </CardContent>
      </Card>

      {(userDetails || selectedProduct) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "ملخص التدفق" : "Flow Summary"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
            <div className="rounded-md border bg-muted/20 p-3 space-y-1">
              <div className="font-semibold">{isAr ? "العميل" : "Customer"}</div>
              {userDetails ? (
                <>
                  <div>{userDetails.name}</div>
                  <div className="text-muted-foreground">{userDetails.email}</div>
                  <div className="text-muted-foreground">{phone || "-"}</div>
                  <div className="font-mono text-xs">{userDetails.id}</div>
                  <div className="font-mono text-xs">
                    {isAr ? "Stream Consumer:" : "Stream Consumer:"} {userDetails.streamConsumerId || "-"}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">{isAr ? "لم يتم اختيار عميل" : "No customer selected"}</div>
              )}
            </div>
            <div className="rounded-md border bg-muted/20 p-3 space-y-1">
              <div className="font-semibold">{isAr ? "المنتج" : "Product"}</div>
              {selectedProduct ? (
                <>
                  <div>{isAr ? selectedProduct.nameAr : selectedProduct.nameEn}</div>
                  <div className="text-muted-foreground">
                    {selectedProduct.price} SAR × {qty || 1} = {total.toFixed(2)} SAR
                  </div>
                  <div className="font-mono text-xs">{selectedProduct.id}</div>
                  <div className="font-mono text-xs">
                    {isAr ? "Stream Product:" : "Stream Product:"} {selectedProduct.streamProductId || "-"}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">{isAr ? "لم يتم اختيار منتج" : "No product selected"}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "Step 1: اختيار العميل" : "Step 1: Select Customer"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-search">{isAr ? "بحث" : "Search"}</Label>
              <Input id="u-search" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{isAr ? "نوع المستخدم" : "User role"}</Label>
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger dir="ltr">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">{isAr ? "طلاب (عملاء)" : "Students (customers)"}</SelectItem>
                  <SelectItem value="instructor">{isAr ? "مدربين" : "Instructors"}</SelectItem>
                  <SelectItem value="admin">{isAr ? "إدمن" : "Admins"}</SelectItem>
                  <SelectItem value="manager">{isAr ? "مدير" : "Managers"}</SelectItem>
                  <SelectItem value="support">{isAr ? "دعم" : "Support"}</SelectItem>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="sync-limit">{isAr ? "عدد المزامنة" : "Sync limit"}</Label>
                <Input id="sync-limit" value={syncLimit} onChange={(e) => setSyncLimit(e.target.value)} dir="ltr" />
              </div>
              <Button variant="outline" onClick={syncConsumers} disabled={isPending}>
                {isAr ? "مزامنة المشتركين إلى Stream" : "Sync subscribers to Stream"}
              </Button>
            </div>

            {userLoadError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {userLoadError}
              </div>
            ) : userResults.length > 0 ? (
              <div className="rounded-md border">
                {userResults.slice(0, 10).map((u) => (
                  <button
                    key={u.id}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => pickUser(u.id)}
                    type="button"
                  >
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">{isAr ? "لا يوجد نتائج" : "No results"}</div>
            )}

            {userDetails && (
              <div className="rounded-md border bg-muted/20 p-3 text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">{isAr ? "الاسم:" : "Name:"}</span> {userDetails.name}
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span> {userDetails.email}
                </div>
                <div>
                  <span className="text-muted-foreground">{isAr ? "الجوال:" : "Phone:"}</span> {phone || "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">{isAr ? "لغة مفضلة:" : "Preferred language:"}</span> {preferredLanguage || "-"}
                </div>
                <div className="font-mono text-xs">
                  <span className="text-muted-foreground">{isAr ? "User ID:" : "User ID:"}</span> {userDetails.id}
                </div>
                <div className="font-mono text-xs">
                  <span className="text-muted-foreground">{isAr ? "Stream Consumer ID:" : "Stream Consumer ID:"}</span>{" "}
                  {userDetails.streamConsumerId || "-"}
                </div>
              </div>
            )}

            {flowError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {flowError}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={nextFromStep1} disabled={isPending || !selectedUserId || !userDetails}>
                {isPending ? (isAr ? "جاري..." : "Working...") : isAr ? "التالي" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "Step 2: اختيار/إنشاء منتج" : "Step 2: Select or Create Product"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="p-search">{isAr ? "بحث في المنتجات" : "Search products"}</Label>
              <Input id="p-search" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
            </div>

            <div className="rounded-md border max-h-[280px] overflow-auto">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${p.id === selectedProductId ? "bg-primary/10" : ""}`}
                  onClick={() => setSelectedProductId(p.id)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{isAr ? p.nameAr : p.nameEn}</div>
                    <div className="font-mono text-xs text-muted-foreground">{p.price} SAR</div>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{p.id}</div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {isAr ? "لا يوجد منتجات" : "No products"}
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isAr ? "إنشاء منتج جديد" : "Create new product"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="np-en">{isAr ? "الاسم (EN)" : "Name (EN)"}</Label>
                    <Input id="np-en" value={newProductNameEn} onChange={(e) => setNewProductNameEn(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="np-ar">{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
                    <Input id="np-ar" value={newProductNameAr} onChange={(e) => setNewProductNameAr(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="np-price">{isAr ? "السعر" : "Price"}</Label>
                    <Input id="np-price" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} dir="ltr" />
                  </div>
                </div>
                <Button onClick={createProduct} disabled={isPending || !newProductNameEn.trim() || !newProductPrice.trim()}>
                  {isPending ? (isAr ? "جاري..." : "Working...") : isAr ? "إنشاء" : "Create"}
                </Button>
              </CardContent>
            </Card>

            {selectedProduct && (
              <div className="rounded-md border bg-muted/20 p-3 text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">{isAr ? "المنتج:" : "Product:"}</span> {isAr ? selectedProduct.nameAr : selectedProduct.nameEn}
                </div>
                <div className="font-mono text-xs">
                  <span className="text-muted-foreground">{isAr ? "Local ID:" : "Local ID:"}</span> {selectedProduct.id}
                </div>
                <div className="font-mono text-xs">
                  <span className="text-muted-foreground">{isAr ? "Stream Product ID:" : "Stream Product ID:"}</span>{" "}
                  {selectedProduct.streamProductId || "-"}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={isPending}>
                {isAr ? "رجوع" : "Back"}
              </Button>
              <Button onClick={nextFromStep2} disabled={isPending || !selectedProductId}>
                {isPending ? (isAr ? "جاري..." : "Working...") : isAr ? "التالي" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "Step 3: إعداد الفاتورة/الدفع" : "Step 3: Configure Invoice / Payment"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="grid gap-2 md:grid-cols-2">
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="invoice" id="mode-invoice" />
                <Label htmlFor="mode-invoice">{isAr ? "إنشاء فاتورة" : "Create Invoice"}</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="payment_link" id="mode-link" />
                <Label htmlFor="mode-link">{isAr ? "إنشاء رابط دفع" : "Create Payment Link"}</Label>
              </div>
            </RadioGroup>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cfg-qty">{isAr ? "الكمية" : "Quantity"}</Label>
                <Input id="cfg-qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfg-currency">Currency</Label>
                <Input id="cfg-currency" value={currency} disabled dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الإجمالي" : "Total"}</Label>
                <div className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm">{total.toFixed(2)} SAR</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cfg-desc">{isAr ? "الوصف" : "Description"}</Label>
              <Input id="cfg-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cfg-due">{isAr ? "تاريخ الاستحقاق (اختياري)" : "Due date (optional)"}</Label>
              <Input
                id="cfg-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                dir="ltr"
              />
            </div>

            {mode === "invoice" && (
              <div className="rounded-md border bg-muted/20 p-3 space-y-3">
                <div className="font-semibold text-sm">{isAr ? "طرق الدفع" : "Payment methods"}</div>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={paymentMethods.mada}
                      onCheckedChange={(v) => setPaymentMethods((prev) => ({ ...prev, mada: Boolean(v) }))}
                    />
                    Mada
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={paymentMethods.visa}
                      onCheckedChange={(v) => setPaymentMethods((prev) => ({ ...prev, visa: Boolean(v) }))}
                    />
                    Visa
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={paymentMethods.mastercard}
                      onCheckedChange={(v) => setPaymentMethods((prev) => ({ ...prev, mastercard: Boolean(v) }))}
                    />
                    Mastercard
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={paymentMethods.amex}
                      onCheckedChange={(v) => setPaymentMethods((prev) => ({ ...prev, amex: Boolean(v) }))}
                    />
                    Amex
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={paymentMethods.bank_transfer}
                      onCheckedChange={(v) => setPaymentMethods((prev) => ({ ...prev, bank_transfer: Boolean(v) }))}
                    />
                    {isAr ? "تحويل بنكي" : "Bank transfer"}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={paymentMethods.installment}
                      onCheckedChange={(v) => setPaymentMethods((prev) => ({ ...prev, installment: Boolean(v) }))}
                    />
                    {isAr ? "تقسيط" : "Installments"}
                  </label>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cfg-meta">{isAr ? "Custom metadata (JSON)" : "Custom metadata (JSON)"}</Label>
              <Textarea id="cfg-meta" value={customMetadata} onChange={(e) => setCustomMetadata(e.target.value)} className="min-h-[180px] font-mono text-xs" dir="ltr" />
            </div>

            <div className="rounded-md border bg-muted/20 p-3 space-y-3">
              <div className="font-semibold text-sm">{isAr ? "إرسال للعميل (افتراضي)" : "Send to customer (default)"}</div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={sendEmail} onCheckedChange={(v) => setSendEmail(Boolean(v))} />
                  {isAr ? "إرسال على الإيميل" : "Send via email"}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={sendWhatsapp} onCheckedChange={(v) => setSendWhatsapp(Boolean(v))} />
                  {isAr ? "إرسال على واتساب" : "Send via WhatsApp"}
                </label>
              </div>
              <div className="text-xs text-muted-foreground">
                {isAr ? "سيتم تجهيز روابط إرسال جاهزة بعد إنشاء الفاتورة/رابط الدفع." : "Send links will be generated after creation."}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} disabled={isPending}>
                {isAr ? "رجوع" : "Back"}
              </Button>
              <Button onClick={nextFromStep3} disabled={isPending}>
                {isAr ? "التالي" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "Step 4: مراجعة وتنفيذ" : "Step 4: Review and Submit"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted/20 p-3 text-sm space-y-2">
              <div className="font-semibold">{isAr ? "العميل" : "Customer"}</div>
              <div>{userDetails ? `${userDetails.name} — ${userDetails.email}` : "-"}</div>
              <div className="font-mono text-xs">{selectedUserId || "-"}</div>

              <div className="font-semibold mt-3">{isAr ? "المنتج" : "Product"}</div>
              <div>{selectedProduct ? (isAr ? selectedProduct.nameAr : selectedProduct.nameEn) : "-"}</div>
              <div className="font-mono text-xs">{selectedProductId || "-"}</div>

              <div className="font-semibold mt-3">{isAr ? "التنفيذ" : "Execution"}</div>
              <div>{mode === "invoice" ? (isAr ? "فاتورة" : "Invoice") : isAr ? "رابط دفع" : "Payment Link"}</div>
              <div>{isAr ? "الكمية:" : "Quantity:"} {qty || "-"}</div>
              <div>{isAr ? "الإجمالي:" : "Total:"} {total.toFixed(2)} SAR</div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} disabled={isPending}>
                {isAr ? "رجوع" : "Back"}
              </Button>
              <Button onClick={submit} disabled={isPending}>
                {isPending
                  ? isAr
                    ? "جاري التنفيذ..."
                    : "Submitting..."
                  : sendEmail || sendWhatsapp
                    ? isAr
                      ? "إنشاء وإرسال"
                      : "Create and Send"
                    : mode === "invoice"
                      ? "Create Invoice"
                      : "Create Payment Link"}
              </Button>
            </div>

            {flowError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {flowError}
              </div>
            )}

            {result && (
              <pre className="max-h-[520px] overflow-auto rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}

            {share && (sendEmail || sendWhatsapp) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{isAr ? "إرسال للعميل" : "Send to customer"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {sendEmail && share.mailto && (
                      <Button asChild variant="outline">
                        <a href={share.mailto} target="_blank" rel="noreferrer">
                          {isAr ? "فتح الإيميل" : "Open email"}
                        </a>
                      </Button>
                    )}
                    {sendWhatsapp && share.whatsapp && (
                      <Button asChild variant="outline">
                        <a href={share.whatsapp} target="_blank" rel="noreferrer">
                          {isAr ? "فتح واتساب" : "Open WhatsApp"}
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await navigator.clipboard.writeText(share.message)
                        toast.success(isAr ? "تم نسخ الرسالة" : "Message copied")
                      }}
                    >
                      {isAr ? "نسخ الرسالة" : "Copy message"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await navigator.clipboard.writeText(share.url)
                        toast.success(isAr ? "تم نسخ الرابط" : "Link copied")
                      }}
                    >
                      {isAr ? "نسخ الرابط" : "Copy link"}
                    </Button>
                  </div>
                  {sendEmail && !share.mailto && (
                    <div className="text-sm text-muted-foreground">{isAr ? "لا يوجد إيميل للمستخدم." : "User has no email."}</div>
                  )}
                  {sendWhatsapp && !share.whatsapp && (
                    <div className="text-sm text-muted-foreground">{isAr ? "لا يوجد رقم جوال صالح للواتساب." : "No valid WhatsApp number."}</div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
