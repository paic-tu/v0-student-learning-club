"use client"

import { useState } from "react"
import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import { Button } from "@/components/ui/button"
import { Loader2, Download } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface CertificateTemplateProps {
  studentName: string
  courseName: string
  instructorName: string
  completionDate: string
  className?: string
}

export function CertificateDownloadButton({
  studentName,
  courseName,
  instructorName,
  completionDate,
  className,
}: CertificateTemplateProps) {
  const { language } = useLanguage()
  const [isGenerating, setIsGenerating] = useState(false)

  const safeStudentName = studentName || "Student Name"
  const safeCourseName = courseName || "Course Name"

  const handleDownload = async () => {
    try {
      setIsGenerating(true)

      // 1. Create a new PDF document
      const pdfDoc = await PDFDocument.create()
      if (fontkit) {
        pdfDoc.registerFontkit(fontkit)
        console.log("Fontkit registered")
      } else {
        console.warn("Fontkit not found, custom fonts may fail")
      }

      // 2. Load the SVG background
      // We render the SVG to a canvas first to convert it to PNG
      const svgUrl = "/certificates/neon-certificate.svg"
      const img = new Image()
      img.src = svgUrl
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = document.createElement("canvas")
      // Use the intrinsic size of the SVG
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")
      ctx.drawImage(img, 0, 0)
      
      const pngDataUrl = canvas.toDataURL("image/png")
      const pngBytes = await fetch(pngDataUrl).then((res) => res.arrayBuffer())
      const embeddedImage = await pdfDoc.embedPng(pngBytes)

      // 3. Add a page with the dimensions of the SVG (converted to points if needed, or A4)
      // SVG viewBox is 0 0 842.25 595.5 (Landscape A4)
      // We'll use standard A4 Landscape size
      const width = 842.25
      const height = 595.5
      const page = pdfDoc.addPage([width, height])

      // Draw the background image
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width,
        height,
      })

      // 4. Load Custom Font (Cormorant Garamond Regular)
      // Load from local public folder
      let font: PDFFont
      try {
        console.log("Attempting to load custom font...")
        // Add cache buster to ensure fresh fetch
        const fontUrl = `/fonts/CormorantGaramond-Regular.ttf?v=${Date.now()}`
        const fontBytes = await fetch(fontUrl).then((res) => {
          if (!res.ok) throw new Error(`Failed to load font: ${res.status} ${res.statusText}`)
          return res.arrayBuffer()
        })
        font = await pdfDoc.embedFont(fontBytes)
        console.log("Custom font loaded successfully")
      } catch (e) {
        console.error("Failed to load custom font, falling back to Times Roman", e)
        // Fallback to a Serif font (Times Roman) which is closer to Garamond than Helvetica
        font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
      }

      // 5. Draw Text
      // Dimensions provided by user (in cm):
      // Student Name: x=4.96, y=9.2, w=21.68, h=1.54
      // Course Name: x=6.82, y=12.48, w=19.82, h=1.41
      
      const cmToPt = 28.3465
      
      // Helper function to draw text in a box with Left alignment
      // NOTE: Strictly adheres to user provided coordinates for X and Y
      const drawTextInBox = (
        text: string,
        boxX_cm: number,
        boxY_cm: number,
        boxW_cm: number,
        boxH_cm: number,
        fontSize: number
      ) => {
        const textHeight = font.heightAtSize(fontSize)
        const textWidth = font.widthOfTextAtSize(text, fontSize)

        // Horizontal Position (Left Aligned)
        // Strictly use the provided X coordinate
        const boxX_pt = boxX_cm * cmToPt
        const x = boxX_pt

        // Calculate vertical center (approximate for baseline)
        // PDF Y starts from bottom
        const boxY_pt_from_top = boxY_cm * cmToPt
        const boxH_pt = boxH_cm * cmToPt
        const boxCenterY_from_top = boxY_pt_from_top + (boxH_pt / 2)
        
        // PDF Y = PageHeight - BoxCenterY - (TextHeight / 2) + Adjustment
        const y = height - boxCenterY_from_top - (textHeight / 2) + (fontSize / 3) 

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0), // Black color
        })
      }

      // Student Name
      drawTextInBox(
        safeStudentName,
        3.0, // Nudged slightly right from 2.5 to 3.0
        9.5, // Moved down slightly from 9.2 to 9.5
        21.68,
        1.54,
        30 // Font size
      )

      // Course Name
      drawTextInBox(
        safeCourseName,
        3.0, // Nudged slightly right from 2.5 to 3.0
        12.48,
        19.82,
        1.41,
        24 // Font size
      )

      const bytes = await pdfDoc.save()
      const pdfArrayBuffer = new ArrayBuffer(bytes.byteLength)
      new Uint8Array(pdfArrayBuffer).set(bytes)
      const blob = new Blob([pdfArrayBuffer], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${safeCourseName.replace(/\s+/g, "_")}_Certificate.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to generate certificate:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Button 
        onClick={handleDownload} 
        disabled={isGenerating}
        className={className}
        variant="outline"
        size="sm"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span className="ml-2 hidden sm:inline">
          {isGenerating ? (language === "ar" ? "جاري التحميل..." : "Generating...") : (language === "ar" ? "تحميل الشهادة" : "Download Certificate")}
        </span>
      </Button>
    </>
  )
}
