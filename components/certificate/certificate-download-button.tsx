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

// Configuration types
type TextConfig = {
  x: number // cm
  y: number // cm
  maxWidth: number // cm
  fontSize: number // pt
  align: 'left' | 'center' | 'right'
}

type CertificateDesignConfig = {
  width: number // pt
  height: number // pt
  studentName: TextConfig
  courseName: TextConfig
  certificateNumber?: TextConfig
}

const DESIGNS: Record<string, CertificateDesignConfig> = {
  'design-1': {
    width: 842.25, // A4 Landscape
    height: 595.5,
    studentName: { x: 3.0, y: 9.2, maxWidth: 21.68, fontSize: 30, align: 'left' },
    courseName: { x: 3.0, y: 12.48, maxWidth: 19.82, fontSize: 24, align: 'left' },
    certificateNumber: { x: 21.0, y: 19.17, maxWidth: 7.33, fontSize: 14.1, align: 'center' } // Shifted left ~1cm (approx 4 spaces)
  },
  'design-2': {
    width: 842.25, // A4 Landscape
    height: 595.5,
    studentName: { x: 3.0, y: 9.2, maxWidth: 21.68, fontSize: 30, align: 'left' },
    courseName: { x: 3.0, y: 12.48, maxWidth: 19.82, fontSize: 24, align: 'left' },
    certificateNumber: { x: 21.0, y: 19.17, maxWidth: 7.33, fontSize: 14.1, align: 'center' } // Shifted left ~1cm
  },
  'design-3': {
    width: 842.25, // A4 Landscape
    height: 595.5,
    studentName: { x: 3.0, y: 9.2, maxWidth: 21.68, fontSize: 30, align: 'left' },
    courseName: { x: 3.0, y: 12.48, maxWidth: 19.82, fontSize: 24, align: 'left' },
    certificateNumber: { x: 21.0, y: 19.17, maxWidth: 7.33, fontSize: 14.1, align: 'center' } // Shifted left ~1cm
  }
}

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
          certNum = "NEON-PENDING"
        }
      }

      // 1. Create a new PDF document
      const pdfDoc = await PDFDocument.create()
      if (fontkit) {
        pdfDoc.registerFontkit(fontkit)
      }

      // Get design config
      const designConfig = DESIGNS[selectedDesign] || DESIGNS['design-1']

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

      // 3. Add a page with configured dimensions
      const width = designConfig.width
      const height = designConfig.height
      const page = pdfDoc.addPage([width, height])

      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width,
        height,
      })

      // 4. Load Custom Font
      let font: PDFFont
      let arimoFont: PDFFont | undefined
      
      try {
         // Use Amiri font for Arabic support
         const fontUrl = `/fonts/Amiri-Regular.ttf`
         const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer())
         font = await pdfDoc.embedFont(fontBytes)
      } catch (e) {
        console.error("Failed to load custom font, falling back to standard font", e)
        font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
      }

      try {
         const fontUrl = `/fonts/Amiri-Bold.ttf`
         const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer())
         arimoFont = await pdfDoc.embedFont(fontBytes)
      } catch (e) {
         arimoFont = font
      }

      // 5. Draw Text Helper
      const cmToPt = 28.3465
      
      const drawTextInBox = (
        text: string,
        config: TextConfig,
        fontToUse: PDFFont
      ) => {
        const fontSize = config.fontSize
        const textWidth = fontToUse.widthOfTextAtSize(text, fontSize)
        const textHeight = fontToUse.heightAtSize(fontSize)
        
        const boxX_pt = config.x * cmToPt
        const boxW_pt = config.maxWidth * cmToPt
        
        let x = boxX_pt
        if (config.align === 'center') {
          // Center within the box width starting from x
          // But if we want to align to a specific X point, we should treat x as the center point?
          // The previous logic treated x as the left edge of the box.
          // Let's stick to that: x is left edge of the bounding box.
          // If we want to center on the page, x should be (PageWidth - BoxWidth) / 2
          // But my config for Design 3 assumed x was the center point? 
          // No, I set x=14.85 which is the center of the page.
          // If I want to center text AT 14.85, then:
          // x = 14.85 * cmToPt - (textWidth / 2)
          // The previous logic: x = boxX_pt + (boxW_pt - textWidth) / 2
          // If boxW is 0 or ignored, this logic fails.
          
          // Let's change behavior: if align is center, x is the center point.
          // But for backward compatibility with Design 1, I must check how it was used.
          // Design 1: x=22.02, w=7.33, align=center. 
          // It meant: the box starts at 22.02 and has width 7.33. Center text inside that box.
          
          // For Design 3, I want to center on the page.
          // So I should define a box that spans the page width?
          // Or just define the center point.
          
          // Let's assume standard behavior:
          // If align center: x = boxX + (boxW - textWidth) / 2
          x = boxX_pt + (boxW_pt - textWidth) / 2
        } else if (config.align === 'right') {
          x = boxX_pt + boxW_pt - textWidth
        }

        // Y positioning
        const boxY_pt_from_top = config.y * cmToPt
        // Use a default height if not provided in config (e.g. 1.5cm)
        // Design 1 used 1.54, 1.41, 0.59. 
        // My config didn't include height. Let's assume height is roughly fontSize * 1.5?
        // Or just position based on top Y.
        // The previous code centered vertically in the box.
        // Let's use a standard line height factor.
        const boxH_pt = (config.fontSize * 1.5) // Approximate box height from font size if not strict
        
        // Actually, let's just stick to the previous Y logic which was specific.
        // The previous logic:
        // const boxCenterY_from_top = boxY_pt_from_top + (boxH_pt / 2)
        // const y = height - boxCenterY_from_top - (textHeight / 2) + (fontSize / 3)
        
        // This is complicated. Let's simplify:
        // y (pdf coords) = height - y_from_top
        // We want the text baseline to be such that the text is roughly at y_from_top.
        // Let's just use y = height - boxY_pt_from_top - textHeight
        
        const y = height - boxY_pt_from_top - textHeight
        
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font: fontToUse,
          color: rgb(0, 0, 0),
        })
      }

      // Student Name
      drawTextInBox(safeStudentName, designConfig.studentName, font)

      // Course Name
      drawTextInBox(safeCourseName, designConfig.courseName, font)

      // Certificate Number
      if (certNum && designConfig.certificateNumber) {
        drawTextInBox(certNum, designConfig.certificateNumber, arimoFont || font)
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
