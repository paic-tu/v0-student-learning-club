"use client"

import { useState } from "react"
import NextImage from "next/image"
import { PDFDocument } from "pdf-lib"
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

import { checkUserRating } from "@/lib/actions/rating"
import { RatingModal } from "@/components/rating-modal"

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
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [isCheckingRating, setIsCheckingRating] = useState(false)
  const [selectedDesign, setSelectedDesign] = useState("design-1")
  const isAr = language === "ar"

  const safeStudentName = studentName || "Student Name"
  const safeCourseName = courseName || "Course Name"

  const handleCertificateClick = async () => {
    if (skipRatingCheck) {
      setIsOpen(true)
      return
    }
    
    try {
      setIsCheckingRating(true)
      const hasRated = await checkUserRating(courseId)
      if (hasRated) {
        setIsOpen(true)
      } else {
        setShowRatingModal(true)
      }
    } catch (error) {
      console.error("Error checking rating", error)
      // Fallback: open dialog to avoid blocking user completely in case of error
      setIsOpen(true)
    } finally {
      setIsCheckingRating(false)
    }
  }

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
      // Note: We don't need fontkit anymore as we're rendering text to canvas

      // Get design config
      const designConfig = DESIGNS[selectedDesign] || DESIGNS['design-1']

      // 2. Load the SVG background and Fonts
      const svgUrl = `/certificates/${selectedDesign}.svg`
      const img = new Image()
      img.src = svgUrl
      
      // Load fonts
      const fontRegular = new FontFace('Amiri', 'url(/fonts/Amiri-Regular.ttf)')
      const fontBold = new FontFace('Amiri', 'url(/fonts/Amiri-Bold.ttf)', { weight: 'bold' })
      
      await Promise.all([
        new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        }),
        fontRegular.load().then(f => document.fonts.add(f)),
        fontBold.load().then(f => document.fonts.add(f))
      ])

      // 3. Setup High-Res Canvas
      const SCALE_FACTOR = 4 // 4x resolution for high quality print
      const canvas = document.createElement("canvas")
      canvas.width = img.width * SCALE_FACTOR
      canvas.height = img.height * SCALE_FACTOR
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")
      
      // Scale context to match logical units (original image size)
      ctx.scale(SCALE_FACTOR, SCALE_FACTOR)
      
      // Draw background
      ctx.drawImage(img, 0, 0)
      
      // Helper for coordinate conversion
      const cmToPt = 28.3465
      // logical pixels per point
      const scaleX = img.width / designConfig.width
      const scaleY = img.height / designConfig.height 
      
      const drawTextOnCanvas = (
        text: string,
        config: TextConfig,
        isBold: boolean = false
      ) => {
        // Calculate font size in logical pixels
        const fontSizePx = config.fontSize * scaleY
        
        ctx.font = `${isBold ? 'bold ' : ''}${fontSizePx}px "Amiri"`
        ctx.fillStyle = '#000000'
        ctx.textBaseline = 'top' // easier to map from top-left
        
        // Calculate X and Y in logical pixels
        // config.x is cm from left
        const x_pt = config.x * cmToPt
        let x = x_pt * scaleX
        
        // config.y is cm from top
        const y_pt = config.y * cmToPt
        // Adjust y to match baseline or top?
        // PDF-lib logic was: y = height - boxY - textHeight (bottom-left origin)
        // Here we use top-left origin.
        // If config.y represents the top of the text box:
        const y = y_pt * scaleY
        
        // Alignment
        const textMetrics = ctx.measureText(text)
        const textWidth = textMetrics.width
        const boxWidthPx = config.maxWidth * cmToPt * scaleX
        
        if (config.align === 'center') {
          x = x + (boxWidthPx - textWidth) / 2
        } else if (config.align === 'right') {
          x = x + boxWidthPx - textWidth
        }
        
        // Handle RTL if Arabic
        // Check if text contains Arabic characters
        const isArabic = /[\u0600-\u06FF]/.test(text)
        if (isArabic) {
           ctx.direction = 'rtl'
           // For RTL, if align is left (default), we might need adjustment?
           // Canvas handles RTL text drawing correctly if direction is set.
           // But 'x' usually specifies the anchor point.
           // If direction is rtl, 'x' is the right edge? No, x is still the anchor.
           // If textAlign is 'start' (default), it draws from x to left?
           // Let's force explicit textAlign to match our calculation
           ctx.textAlign = 'left' 
           // We calculated 'x' as the left edge of the text (or start point).
           // If we use 'left' align, it draws from x to right.
           // This is correct for the calculated 'x' regardless of script, 
           // because we manually calculated the start position based on alignment.
           ctx.direction = 'inherit' // Reset to inherit or handle manually?
           // Actually, standard Canvas 'direction' handles glyph shaping.
           // If we manually calculated x position, we should just draw LTR style?
           // No, shaping requires context direction.
           
           ctx.direction = 'rtl'
           // If direction is RTL, and textAlign is 'left', does it draw from x to right?
           // Yes, textAlign 'left' is always left.
        } else {
           ctx.direction = 'ltr'
        }
        
        ctx.fillText(text, x, y)
      }

      // Draw Texts
      drawTextOnCanvas(safeStudentName, designConfig.studentName)
      drawTextOnCanvas(safeCourseName, designConfig.courseName)
      
      if (certNum && designConfig.certificateNumber) {
        drawTextOnCanvas(certNum, designConfig.certificateNumber, true)
      }

      // 4. Convert to PNG and Embed in PDF
      const pngDataUrl = canvas.toDataURL("image/png", 1.0)
      const pngBytes = await fetch(pngDataUrl).then((res) => res.arrayBuffer())
      const embeddedImage = await pdfDoc.embedPng(pngBytes)

      // 5. Add a page with configured dimensions
      const width = designConfig.width
      const height = designConfig.height
      const page = pdfDoc.addPage([width, height])

      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width,
        height,
      })

      // Save PDF
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
    <>
      <Button 
        className={className}
        variant="outline"
        size="sm"
        onClick={handleCertificateClick}
        disabled={isCheckingRating}
      >
        {isCheckingRating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span className="ms-2 hidden sm:inline">
          {isAr ? "تحميل الشهادة" : "Download Certificate"}
        </span>
      </Button>

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        courseId={courseId}
        courseTitle={safeCourseName}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                     <NextImage
                       src={`/certificates/design-${num}.svg`}
                       alt={`Design ${num}`}
                       fill
                       className="object-cover"
                       unoptimized
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
    </>
  )
}
