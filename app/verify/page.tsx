"use client"

import { useState } from "react"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { getCertificateByNumber } from "@/lib/db/queries"
import { Shield, CheckCircle2, XCircle, Award } from "lucide-react"

export default function VerifyPage() {
  const { language } = useLanguage()
  const [certNumber, setCertNumber] = useState("")
  const [certificate, setCertificate] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleVerify = async () => {
    if (!certNumber.trim()) return

    setLoading(true)
    setSearched(true)
    try {
      const cert = await getCertificateByNumber(certNumber.trim())
      setCertificate(cert)
    } catch (error) {
      console.error("[v0] Error verifying certificate:", error)
      setCertificate(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-10 w-10 text-primary" />
              <h1 className="text-3xl font-bold">{language === "ar" ? "التحقق من الشهادة" : "Verify Certificate"}</h1>
            </div>
            <p className="text-muted-foreground">
              {language === "ar"
                ? "أدخل رقم الشهادة للتحقق من صحتها"
                : "Enter the certificate number to verify its authenticity"}
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{language === "ar" ? "رقم الشهادة" : "Certificate Number"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certNumber">{language === "ar" ? "الرقم" : "Number"}</Label>
                <Input
                  id="certNumber"
                  placeholder={language === "ar" ? "أدخل رقم الشهادة" : "Enter certificate number"}
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
              </div>
              <Button onClick={handleVerify} disabled={loading || !certNumber.trim()} className="w-full" size="lg">
                {loading ? "..." : language === "ar" ? "تحقق" : "Verify"}
              </Button>
            </CardContent>
          </Card>

          {searched && (
            <Card>
              <CardContent className="pt-6">
                {certificate ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center gap-3 text-green-600">
                      <CheckCircle2 className="h-12 w-12" />
                      <div>
                        <h3 className="text-xl font-bold">{language === "ar" ? "شهادة صالحة" : "Valid Certificate"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "هذه الشهادة معتمدة من نيون" : "This certificate is verified by Neon"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 border-t pt-6">
                      <div className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? "اسم الحاصل على الشهادة" : "Certificate Holder"}
                          </p>
                          <p className="font-semibold text-lg">{certificate.user_name}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? "عنوان الشهادة" : "Certificate Title"}
                          </p>
                          <p className="font-semibold">
                            {language === "ar"
                              ? certificate.title_ar || certificate.course_title_ar || certificate.contest_title_ar
                              : certificate.title_en || certificate.course_title_en || certificate.contest_title_en}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? "تاريخ الإصدار" : "Issue Date"}
                          </p>
                          <p className="font-semibold">
                            {new Date(certificate.issued_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? "رقم الشهادة" : "Certificate Number"}
                          </p>
                          <p className="font-mono font-semibold">{certificate.certificate_number}</p>
                        </div>
                      </div>

                      <div className="pt-4">
                        <Badge variant="default" className="text-sm px-4 py-2">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {language === "ar" ? "معتمد" : "Verified"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-center">
                    <div className="flex items-center justify-center gap-3 text-destructive">
                      <XCircle className="h-12 w-12" />
                      <div>
                        <h3 className="text-xl font-bold">
                          {language === "ar" ? "شهادة غير صالحة" : "Invalid Certificate"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar"
                            ? "لم يتم العثور على شهادة بهذا الرقم"
                            : "No certificate found with this number"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
