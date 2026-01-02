"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { t } from "@/lib/i18n"
import { Clock, BookOpen, Share2, PlayCircle, Lock, Star, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function CourseDetailClient({ course }: { course: any }) {
  const router = useRouter()
  const { language } = useLanguage()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: t("copiedToClipboard", language),
      description: url,
    })
  }

  const handleEnroll = () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    setIsEnrolled(true)
    toast({
      title: t("enrolled", language),
      description: language === "ar" ? "يمكنك الآن البدء بالدراسة" : "You can now start learning",
    })
  }

  // Format duration from minutes to hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}min`
    }
    return `${mins}min`
  }

  return (
    <main className="relative">
      <div className="fixed inset-0 pointer-events-none starfield-light">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      </div>

      {/* Breadcrumb */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/courses">{t("courses", language)}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{language === "ar" ? course.title_ar : course.title_en}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Title Row */}
      <div className="border-b bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-balance">
                {language === "ar" ? course.title_ar : course.title_en}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge variant="secondary" className="gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {course.lessons_count || 0} {t("lessons", language)}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(course.duration || 0)}
                </Badge>
                {course.rating && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {course.rating}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 bg-transparent">
                <Share2 className="h-4 w-4" />
                {t("share", language)}
              </Button>
              {!isEnrolled && (
                <Button size="lg" onClick={handleEnroll} className="gap-2">
                  <Lock className="h-4 w-4" />
                  {course.is_free ? t("enrollFree", language) : t("enrollNow", language)}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Card */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden card-hover cursor-pointer" onClick={() => setShowVideoModal(true)}>
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url || "/placeholder.svg"}
                    alt={language === "ar" ? course.title_ar : course.title_en}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    No thumbnail available
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary/90 backdrop-blur-sm rounded-full p-6 hover:scale-110 transition-transform">
                    <PlayCircle className="h-12 w-12 text-primary-foreground" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Course Info Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-lg">{t("courseDetails", language)}</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("instructor", language)}</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={course.instructor_avatar || undefined} />
                      <AvatarFallback>{course.instructor_name?.charAt(0) || "I"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{course.instructor_name}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("difficulty", language)}</p>
                  <Badge variant="outline" className="capitalize">
                    {course.difficulty}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("description", language)}</p>
                  <p className="text-sm">{language === "ar" ? course.description_ar : course.description_en}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl">
          <div className="aspect-video bg-black">
            {course.video_url ? (
              <iframe
                src={course.video_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">No video available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
