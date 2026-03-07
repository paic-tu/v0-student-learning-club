"use client"

import { useState } from "react"
import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import { Button } from "@/components/ui/button"
import { Loader2, Download, Check, LayoutTemplate } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { getOrCreateCertificate } from "@/lib/actions/certificate"

interface CertificateTemplateProps {
  studentName: string
  courseName: string
  instructorName: string
  completionDate: string
  courseId: string
  certificateNumber?: string | null
  className?: string
}

export function CertificateDownloadButton({
  studentName,
  courseName,
  instructorName,
  completionDate,
  courseId,
  certificateNumber: initialCertificateNumber,
  className,
}: CertificateTemplateProps) {
  const { language } = useLanguage()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDesign, setSelectedDesign] = useState("design-1")
  const isAr = language === "ar"

  const safeStudentName = studentName || "Student Name"
  const safeCourseName = courseName || "Course Name"

  const handleDownload = async () => {
    try {
      setIsGenerating(true)

      // 0. Get or create certificate number from server
      let certNum = initialCertificateNumber
      if (!certNum) {
        try {
          const result = await getOrCreateCertificate(courseId)
          certNum = result.certificateNumber
        } catch (err) {
          console.error("Failed to fetch certificate number", err)
          // Fallback if server action fails (should not happen in normal flow)
          certNum = "NEON-PENDING"
        }
      }

      // 1. Create a new PDF document
      const pdfDoc = await PDFDocument.create()
      if (fontkit) {
        pdfDoc.registerFontkit(fontkit)
      }

      // 2. Load the SVG background
      const svgUrl = `/certificates/${selectedDesign}.svg`
      const img = new Image()
      img.src = svgUrl
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")
      ctx.drawImage(img, 0, 0)
      
      const pngDataUrl = canvas.toDataURL("image/png")
      const pngBytes = await fetch(pngDataUrl).then((res) => res.arrayBuffer())
      const embeddedImage = await pdfDoc.embedPng(pngBytes)

      // 3. Add a page
      const width = 842.25
      const height = 595.5
      const page = pdfDoc.addPage([width, height])

      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width,
        height,
      })

      // 4. Load Custom Font (Arimo if available, otherwise Helvetica/Times)
      let font: PDFFont
      let arimoFont: PDFFont | undefined
      
      try {
         // Try to load Arimo or fallback to Cormorant/Times
         // Since user specifically asked for Arimo for the number, let's try to load it if present
         // Otherwise we use StandardFonts
         
         // Load main font for names (Cormorant Garamond as before)
         const fontUrl = `/fonts/CormorantGaramond-Regular.ttf?v=${Date.now()}`
         const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer())
         font = await pdfDoc.embedFont(fontBytes)
      } catch (e) {
        font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
      }

      // Try to load Arimo for the number specifically if possible, or use Helvetica
      try {
         // We don't have Arimo locally yet, so we use Helvetica as a clean sans-serif fallback
         // which is very similar to Arimo.
         arimoFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      } catch (e) {
         arimoFont = font
      }

      // 5. Draw Text
      const cmToPt = 28.3465
      
      const drawTextInBox = (
        text: string,
        boxX_cm: number,
        boxY_cm: number,
        boxW_cm: number,
        boxH_cm: number,
        fontSize: number,
        fontToUse: PDFFont,
        align: 'left' | 'center' | 'right' = 'left'
      ) => {
        const textWidth = fontToUse.widthOfTextAtSize(text, fontSize)
        const textHeight = fontToUse.heightAtSize(fontSize)
        
        const boxX_pt = boxX_cm * cmToPt
        const boxW_pt = boxW_cm * cmToPt
        
        let x = boxX_pt
        if (align === 'center') {
          x = boxX_pt + (boxW_pt - textWidth) / 2
        } else if (align === 'right') {
          x = boxX_pt + boxW_pt - textWidth
        }

        const boxY_pt_from_top = boxY_cm * cmToPt
        const boxH_pt = boxH_cm * cmToPt
        const boxCenterY_from_top = boxY_pt_from_top + (boxH_pt / 2)
        
        const y = height - boxCenterY_from_top - (textHeight / 2) + (fontSize / 3) 

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font: fontToUse,
          color: rgb(0, 0, 0),
        })
      }

      // Student Name
      drawTextInBox(
        safeStudentName,
        3.0,
        9.2,
        21.68,
        1.54,
        30,
        font,
        'left'
      )

      // Course Name
      drawTextInBox(
        safeCourseName,
        3.0,
        12.48,
        19.82,
        1.41,
        24,
        font,
        'left'
      )

      // Certificate Number
      // User specified: width 7.33 height 0.59 x = 22.02 y = 19.17 Font Arimo size 14.1
      if (certNum) {
        drawTextInBox(
          certNum,
          22.02,
          19.17,
          7.33,
          0.59,
          14.1,
          arimoFont || font,
          'center'
        )
      }

      const bytes = await pdfDoc.save()
      const blob = new Blob([bytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${safeCourseName.replace(/\s+/g, "_")}_Certificate.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to generate certificate:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className={className}
          variant="outline"
          size="sm"
        >
          <Download className="h-4 w-4" />
          <span className="ms-2 hidden sm:inline">
            {isAr ? "تحميل الشهادة" : "Download Certificate"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isAr ? "اختر تصميم الشهادة" : "Choose Certificate Design"}</DialogTitle>
          <DialogDescription>
            {isAr 
              ? "اختر التصميم الذي تفضله لشهادتك من الخيارات أدناه." 
              : "Select the design you prefer for your certificate from the options below."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <RadioGroup 
            value={selectedDesign} 
            onValueChange={setSelectedDesign}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[1, 2, 3].map((num) => (
              <div key={num}>
                <RadioGroupItem
                  value={`design-${num}`}
                  id={`design-${num}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`design-${num}`}
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
                >
                  <div className="relative w-full aspect-[1.41] bg-muted mb-2 rounded overflow-hidden border">
                     {/* Preview Image - using the SVG itself */}
                     <img 
                       src={`/certificates/design-${num}.svg`} 
                       alt={`Design ${num}`}
                       className="object-cover w-full h-full"
                     />
                     {selectedDesign === `design-${num}` && (
                       <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                         <Check className="w-3 h-3" />
                       </div>
                     )}
                  </div>
                  <span className="text-sm font-medium">
                    {isAr ? `تصميم ${num}` : `Design ${num}`}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button onClick={handleDownload} disabled={isGenerating} className="w-full sm:w-auto">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isAr ? "جاري التحميل..." : "Generating..."}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {isAr ? "تحميل PDF" : "Download PDF"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
