"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { CertificateDownloadButton } from "@/components/certificate/certificate-download-button"
import { Award, Calendar, Hash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CertificatesGridProps {
  displayItems: any[]
  isAr: boolean
  studentName: string
  highlight?: string
}

export function CertificatesGrid({ displayItems, isAr, studentName, highlight }: CertificatesGridProps) {
  useEffect(() => {
    if (!highlight) return
    const el = document.getElementById(`certificate-${highlight}`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [highlight])

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {displayItems.map((item: any) => {
        const isHighlighted = Boolean(highlight) && item.certificateNumber === highlight

        return (
          <Card
            key={item.id}
            id={item.certificateNumber ? `certificate-${item.certificateNumber}` : undefined}
            className={cn(
              "flex flex-col overflow-hidden transition-all hover:shadow-md",
              isHighlighted && "border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/10"
            )}
          >
            <div className="h-3 bg-primary/10 border-b border-primary/20" />
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <Badge variant={item.isOfficial ? "default" : "secondary"} className="w-fit mb-2">
                  {item.isOfficial
                    ? (isAr ? "معتمدة" : "Official")
                    : (isAr ? "مكتملة" : "Completed")}
                </Badge>
                <Award className={`w-5 h-5 ${item.isOfficial ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <CardTitle className="line-clamp-2 min-h-[3.5rem]">
                {isAr ? item.titleAr : item.titleEn}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded">
                  {item.instructorName || (isAr ? "محسن الغامدي" : "Mohsen Alghamdi")}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(item.issuedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {item.certificateNumber && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="w-4 h-4" />
                  <span className="font-mono text-xs">{item.certificateNumber}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-2 pb-6">
              <CertificateDownloadButton
                studentName={studentName}
                courseName={isAr ? item.titleAr : item.titleEn}
                courseNameAr={item.titleAr}
                courseNameEn={item.titleEn}
                instructorName={item.instructorName || (isAr ? "محسن الغامدي" : "Mohsen Alghamdi")}
                completionDate={new Date(item.issuedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                courseId={item.courseId}
                certificateNumber={item.certificateNumber}
                className="w-full"
              />
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
