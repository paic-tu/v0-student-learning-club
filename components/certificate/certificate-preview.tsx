"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Check } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface CertificatePreviewProps {
  studentName: string
  certificates: any[]
}

export function CertificatePreview({ studentName, certificates }: CertificatePreviewProps) {
  const { language } = useLanguage()
  const isAr = language === "ar"
  
  const [selectedCertId, setSelectedCertId] = useState<string>(certificates.length > 0 ? certificates[0].id : "")
  const [previewStudentName, setPreviewStudentName] = useState(studentName)
  const [selectedDesign, setSelectedDesign] = useState("design-1")
  
  // Get the selected certificate object
  const selectedCert = certificates.find(c => c.id === selectedCertId)
  
  // Determine the course name to display
  const previewCourseName = selectedCert 
    ? (isAr ? selectedCert.course_title_ar || selectedCert.title_ar : selectedCert.course_title_en || selectedCert.title_en)
    : (isAr ? "اسم الدورة التدريبية" : "Course Name")

  // Update student name when prop changes
  useEffect(() => {
    setPreviewStudentName(studentName)
  }, [studentName])

  // If certificates change, update selection
  useEffect(() => {
    if (certificates.length > 0 && !selectedCertId) {
      setSelectedCertId(certificates[0].id)
    }
  }, [certificates, selectedCertId])

  // Coordinate calculations (based on 29.7cm width x 21.0cm height)
  // Student Name: x=3.0cm, y=9.2cm
  // Course Name: x=3.0cm, y=12.48cm
  
  // NOTE: These percentages must MATCH the PDF generation logic
  // PDF Width: 29.7cm (A4 Landscape)
  // PDF Height: 21.0cm
  const pdfWidthCm = 29.7
  const pdfHeightCm = 21.0

  const studentNameLeft = (3.0 / pdfWidthCm) * 100
  const studentNameTop = (9.2 / pdfHeightCm) * 100
  
  const courseNameLeft = (3.0 / pdfWidthCm) * 100
  const courseNameTop = (12.48 / pdfHeightCm) * 100

  // Certificate Number: x=21.0cm, y=19.17cm
  const certNumLeft = (21.0 / pdfWidthCm) * 100
  const certNumTop = (19.17 / pdfHeightCm) * 100

  return (
    <Card className="w-full">
      <style jsx global>{`
        @font-face {
          font-family: 'Cormorant Garamond';
          src: url('/fonts/CormorantGaramond-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
      `}</style>
      
      <CardHeader>
        <CardTitle>{isAr ? "معاينة الشهادة" : "Certificate Preview"}</CardTitle>
        <CardDescription>
          {isAr 
            ? "شاهد كيف ستبدو شهادتك مع اسمك واسم الدورة" 
            : "See how your certificate looks with your name and course"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content: Inputs & Preview */}
          <div className="flex-1 space-y-6 order-2 lg:order-1">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "اسم الطالب" : "Student Name"}</Label>
                <div className="h-9 px-3 py-1 flex items-center border rounded-md bg-muted text-muted-foreground font-serif">
                   {previewStudentName}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{isAr ? "الدورة" : "Course"}</Label>
                {certificates.length > 0 ? (
                  <Select value={selectedCertId} onValueChange={setSelectedCertId}>
                    <SelectTrigger>
                      <SelectValue placeholder={isAr ? "اختر دورة..." : "Select a course..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {certificates.map((cert) => (
                        <SelectItem key={cert.id} value={cert.id}>
                          {isAr ? cert.course_title_ar || cert.title_ar : cert.course_title_en || cert.title_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                   <div className="h-9 px-3 py-1 flex items-center border rounded-md bg-muted text-muted-foreground">
                    {isAr ? "لا توجد شهادات متاحة" : "No certificates available"}
                  </div>
                )}
              </div>
            </div>

            <div className="relative w-full overflow-hidden rounded-lg shadow-md bg-white border">
              {/* Aspect Ratio Box for A4 Landscape (sqrt(2) approx 1.414) */}
              <div style={{ paddingBottom: "70.707%" /* 100% / 1.414 */ }} />
              
              {/* Background Image */}
              <Image
                src={`/certificates/${selectedDesign}.svg`}
                alt="Certificate Background"
                fill
                className="object-contain"
                unoptimized
              />
              
              {/* Overlays */}
              <div 
                className="absolute text-black whitespace-nowrap"
                style={{
                  left: `${studentNameLeft}%`,
                  top: `${studentNameTop}%`,
                  fontFamily: "'Amiri', 'Cormorant Garamond', serif",
                  fontSize: "clamp(12px, 3.2vw, 36px)", // Scaled to match PDF ~30pt
                  transform: "translateY(-50%)", // Center vertically on the line
                  pointerEvents: "none",
                  color: "black"
                }}
              >
                {previewStudentName}
              </div>
              
              <div 
                className="absolute text-black whitespace-nowrap"
                style={{
                  left: `${courseNameLeft}%`,
                  top: `${courseNameTop}%`,
                  fontFamily: "'Amiri', 'Cormorant Garamond', serif",
                  fontSize: "clamp(10px, 2.5vw, 28px)", // Scaled to match PDF ~24pt
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "black"
                }}
              >
                {previewCourseName}
              </div>

              {selectedCert?.certificate_number && (
                <div 
                  className="absolute text-black whitespace-nowrap text-center"
                  style={{
                    left: `${certNumLeft}%`,
                    top: `${certNumTop}%`,
                    fontFamily: "'Amiri', 'Cormorant Garamond', serif",
                    fontSize: "clamp(8px, 1.5vw, 16px)", // Scaled to match PDF ~14.1pt
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                    color: "black"
                  }}
                >
                  {selectedCert.certificate_number}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Design Selector */}
          <div className="w-full lg:w-40 space-y-3 order-1 lg:order-2">
            <Label className="text-base font-semibold">{isAr ? "تصميم الشهادة" : "Certificate Design"}</Label>
            <RadioGroup 
              value={selectedDesign} 
              onValueChange={setSelectedDesign}
              className="grid grid-cols-3 lg:grid-cols-1 gap-3"
            >
              {[1, 2, 3].map((num) => (
                <div key={num} className="w-full max-w-[120px] lg:max-w-none mx-auto">
                  <RadioGroupItem
                    value={`design-${num}`}
                    id={`preview-design-${num}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`preview-design-${num}`}
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full shadow-sm"
                  >
                    <div className="relative w-full aspect-[1.41] bg-muted rounded overflow-hidden border">
                       <Image
                         src={`/certificates/design-${num}.svg`}
                         alt={`Design ${num}`}
                         fill
                         className="object-cover"
                         unoptimized
                       />
                       {selectedDesign === `design-${num}` && (
                         <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                           <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                             <Check className="w-3 h-3" />
                           </div>
                         </div>
                       )}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
