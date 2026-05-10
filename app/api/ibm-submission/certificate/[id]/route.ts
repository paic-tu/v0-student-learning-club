import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ibmSubmissions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import fs from "fs"
import path from "path"
// @ts-ignore
import arabicReshaper from 'arabic-reshaper'
// @ts-ignore
import bidiFactory from 'bidi-js'

const bidi = bidiFactory()

function processArabicText(text: string) {
  const reshapedText = arabicReshaper.reshape(text)
  const bidiText = bidi.getReorderedText(reshapedText)
  return bidiText
}

function containsArabic(text: string) {
  const arabicRegex = /[\u0600-\u06FF]/
  return arabicRegex.test(text)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const submission = await db.query.ibmSubmissions.findFirst({
      where: eq(ibmSubmissions.id, id),
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Load the template
    const templatePath = path.join(process.cwd(), "public", "templates", "ibm-certificate-template.png")
    
    if (!fs.existsSync(templatePath)) {
      console.error("Template not found at:", templatePath)
      return NextResponse.json({ error: "Certificate template not found. Please ensure it's uploaded to public/templates/ibm-certificate-template.png" }, { status: 500 })
    }

    const templateImageBytes = fs.readFileSync(templatePath)

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)

    // Embed the template image
    const templateImage = await pdfDoc.embedPng(templateImageBytes)
    const { width, height } = templateImage.scale(1)

    // Add a page with the same dimensions as the template
    const page = pdfDoc.addPage([width, height])
    page.drawImage(templateImage, {
      x: 0,
      y: 0,
      width,
      height,
    })

    const isArabic = containsArabic(submission.fullName)
    const textToPrint = isArabic ? processArabicText(submission.fullName) : submission.fullName

    // Load custom fonts
    let font
    const fontsDir = path.resolve(process.cwd(), "public", "fonts")
    
    try {
      if (isArabic) {
        // Use Amiri-Bold for Arabic text (Cormorant doesn't support Arabic)
        const fontPath = path.resolve(fontsDir, "Amiri-Bold.ttf")
        if (fs.existsSync(fontPath)) {
          const fontBytes = fs.readFileSync(fontPath)
          font = await pdfDoc.embedFont(fontBytes)
        } else {
          font = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
        }
      } else {
        // Use Cormorant Garamond for Latin text as requested
        const fontPath = path.resolve(fontsDir, "CormorantGaramond-Regular.ttf")
        if (fs.existsSync(fontPath)) {
          const fontBytes = fs.readFileSync(fontPath)
          font = await pdfDoc.embedFont(fontBytes)
        } else {
          font = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
        }
      }
    } catch (e) {
      console.error("Font loading error:", e)
      font = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    }

    // Coordinates calculation based on A4 Landscape (29.7cm x 21.0cm)
    // We use the image's actual pixel dimensions to calculate the scale accurately
    const pointsPerCm = width / 29.7
    
    // User provided coordinates in CM:
    const xCm = 3.08
    const yCmFromTop = 7.86
    const boxWidthCm = 25.32
    const boxHeightCm = 1.8
    
    // Convert CM to points/pixels relative to image size
    const x = xCm * pointsPerCm
    const yFromTop = yCmFromTop * pointsPerCm
    const boxWidth = boxWidthCm * pointsPerCm
    const boxHeight = boxHeightCm * pointsPerCm
    
    // PDF Y-axis starts from BOTTOM. 
    // Calculation: Total Height - Distance from Top - Box Height
    const y = height - yFromTop - boxHeight

    // Draw the name
    // fontSize is set to a beautiful proportion of the box height (approx 75%)
    const fontSize = boxHeight * 0.75
    const textWidth = font.widthOfTextAtSize(textToPrint, fontSize)
    
    // Alignment: Left-aligned at the X coordinate provided (3.08cm)
    const textX = x
    
    // Vertical Centering: Box bottom + (half box height) - (font adjustment)
    const textY = y + (boxHeight / 2) - (fontSize / 3.5)
    
    page.drawText(textToPrint, {
      x: textX,
      y: textY,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Neon-Certificate-${submission.fullName.replace(/\s+/g, "-")}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("Certificate Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 })
  }
}
