"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { NavBar } from "@/components/nav-bar"
import { Download, CreditCard, User, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

export default function IBMCardPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const { language } = useLanguage()
  const isAr = language === "ar"
  const svgRef = useRef<SVGSVGElement>(null)

  const handleDownload = async () => {
    if (!firstName || !lastName) return
    setIsGenerating(true)

    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas dimensions
      canvas.width = 1600
      canvas.height = 900

      // 1. Draw Background Template
      const img = new window.Image()
      img.src = "/ibm-card-template.png"
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      // Draw image to cover full canvas
      ctx.drawImage(img, 0, 0, 1600, 900)

      // 2. Draw Text Overlay
      // We need to scale our preview coordinates (based on 1200x675) to 1600x900
      const scaleX = 1600 / 1200
      const scaleY = 900 / 675

      const x = parseFloat(coords.x) * scaleX
      const y = parseFloat(coords.y) * scaleY
      const w = parseFloat(coords.width) * scaleX
      const h = parseFloat(coords.height) * scaleY

      // Text styling
      ctx.fillStyle = "white"
      ctx.font = "900 80px 'Segoe UI', Roboto, sans-serif"
      ctx.textBaseline = "middle"
      ctx.textAlign = "left"

      // Add shadow for better visibility
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 4

      // Draw the name
      // We add half the height of the box to Y because textBaseline is middle
      ctx.fillText(fullName, x, y + (h / 2))

      // 3. Export and Download
      const jpegUrl = canvas.toDataURL("image/jpeg", 0.95)
      const downloadLink = document.createElement("a")
      downloadLink.href = jpegUrl
      downloadLink.download = `IBM-Card-${firstName}-${lastName}.jpg`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      
      setIsGenerating(false)
    } catch (error) {
      console.error("Error generating card:", error)
      alert(isAr ? "حدث خطأ أثناء تحميل الصورة. يرجى المحاولة مرة أخرى." : "Error downloading image. Please try again.")
      setIsGenerating(false)
    }
  }

  const fullName = `${firstName} ${lastName}`.trim()

  // Function to detect if text contains Arabic characters
  const hasArabic = (text: string) => /[\u0600-\u06FF]/.test(text)
  const isTextArabic = hasArabic(fullName)

  // Dynamic coordinates based on language (adjusted: shifted slightly more right)
  const coords = isTextArabic 
    ? { x: "113.1", y: "95.7", width: "812.9", height: "110.5" } // Arabic
    : { x: "96.6", y: "110.1", width: "812.9", height: "110.5" } // English

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <NavBar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {isAr ? "بطاقة IBM الخاصة بك" : "Your IBM Card"}
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              {isAr ? "أدخل اسمك للحصول على بطاقتك الشخصية" : "Enter your name to get your personalized card"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Form Section */}
            <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  {isAr ? "بيانات البطاقة" : "Card Details"}
                </CardTitle>
                <CardDescription>
                  {isAr ? "سيتم طباعة هذا الاسم على البطاقة مباشرة" : "This name will be printed directly on the card"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{isAr ? "الاسم الأول" : "First Name"}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="firstName"
                        placeholder={isAr ? "محسن" : "mohsen"}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{isAr ? "الاسم الأخير" : "Last Name"}</Label>
                    <Input
                      id="lastName"
                      placeholder={isAr ? "الغامدي" : "alghamdi"}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleDownload} 
                  className="w-full h-12 text-lg font-bold"
                  disabled={!firstName || !lastName || isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Download className="w-5 h-5 mr-2" />
                  )}
                  {isAr ? "تحميل البطاقة" : "Download Card"}
                </Button>
              </CardContent>
            </Card>

            {/* Preview Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? "معاينة مباشرة" : "Live Preview"}
                </h3>
              </div>
              <div className="relative aspect-[1600/900] w-full bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                <svg
                  ref={svgRef}
                  viewBox="0 0 1200 675"
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Background Template */}
                  <image
                    href="/ibm-card-template.png"
                    width="1200"
                    height="675"
                  />
                  
                  {/* Name Overlay using provided coordinates */}
                  <foreignObject 
                    x={coords.x} 
                    y={coords.y} 
                    width={coords.width} 
                    height={coords.height}
                  >
                    <div 
                      className={cn(
                        "w-full h-full flex items-center justify-start overflow-hidden",
                        isTextArabic ? "font-sans" : "font-serif"
                      )}
                      dir="ltr"
                      style={{
                        color: "white",
                        fontSize: "60px",
                        fontWeight: "900",
                        lineHeight: "1.1",
                        textAlign: "left",
                        textShadow: "0px 2px 4px rgba(0,0,0,0.3)",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {fullName || (isAr ? "الاسم يظهر هنا" : "Your Name Here")}
                    </div>
                  </foreignObject>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
