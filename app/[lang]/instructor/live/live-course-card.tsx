"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Users, Video, Clock } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface LiveCourseCardProps {
  course: any
  isAr: boolean
  lang: string
}

export function LiveCourseCard({ course, isAr, lang }: LiveCourseCardProps) {
  const [isStreaming, setIsStreaming] = useState(course.isStreaming)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggleStream = async (checked: boolean) => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/courses/${course.id}/live-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStreaming: checked }),
      })

      if (!res.ok) throw new Error("Failed to update status")

      setIsStreaming(checked)
      toast.success(isAr ? "تم تحديث حالة البث" : "Stream status updated")
      router.refresh()
    } catch (error) {
      toast.error(isAr ? "حدث خطأ ما" : "Something went wrong")
      // Revert state on error
      setIsStreaming(!checked)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow border-primary/20">
      <div className="relative aspect-video w-full bg-muted">
        {course.thumbnailUrl ? (
          <Image 
            src={course.thumbnailUrl} 
            alt={isAr ? course.titleAr : course.titleEn}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-secondary text-secondary-foreground">
            {isAr ? "لا توجد صورة" : "No Image"}
          </div>
        )}
        
        {/* LIVE Badge - Only shown when streaming is active */}
        {isStreaming && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive" className="animate-pulse">
              LIVE
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader>
        <CardTitle className="line-clamp-1">
          {isAr ? course.titleAr : course.titleEn}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {isAr ? course.descriptionAr : course.descriptionEn}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="mt-auto space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted p-2 rounded-md">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{course.enrollmentCount || 0} {isAr ? "مسجل" : "Registered"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{course.duration || 0} {isAr ? "دقيقة" : "min"}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-2 border rounded-md">
          <Label htmlFor={`stream-toggle-${course.id}`} className="cursor-pointer">
            {isAr ? "إظهار علامة مباشر" : "Show LIVE Badge"}
          </Label>
          <Switch
            id={`stream-toggle-${course.id}`}
            checked={isStreaming}
            onCheckedChange={handleToggleStream}
            disabled={isLoading}
          />
        </div>
        
        <Button asChild className="w-full gap-2" size="lg">
          <Link 
            href={`/${lang}/instructor/courses/${course.id}/live`}
            onClick={() => {
              if (!isStreaming) {
                handleToggleStream(true)
              }
            }}
          >
            <Video className="h-4 w-4" />
            {isAr ? "بدء البث المباشر" : "Start Live Stream"}
          </Link>
        </Button>

        <Button asChild variant="outline" className="w-full">
          <Link href={`/${lang}/instructor/courses/${course.id}/edit`}>
            {isAr ? "إعدادات الدورة" : "Course Settings"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
