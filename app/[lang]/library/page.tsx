"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { t } from "@/lib/i18n"
import { getUserEnrollments, getUserCertificates } from "@/lib/db/queries"
import { BookOpen, Award, Download, ExternalLink } from "lucide-react"
import { RequireAuth } from "@/components/require-auth"

export default function LibraryPage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastLessons, setLastLessons] = useState<Record<number, any>>({})

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        const [enrollmentsData, certificatesData] = await Promise.all([
          getUserEnrollments(user.id),
          getUserCertificates(user.id),
        ])
        setEnrollments(enrollmentsData)
        setCertificates(certificatesData)

        const lastLessonsMap: Record<number, any> = {}
        // For now, we'll use the first lesson as default since last_accessed_lesson_id might not be in the response yet
        enrollmentsData.forEach((enrollment) => {
          lastLessonsMap[enrollment.course_id] = {
            id: enrollment.first_lesson_id || 1,
            title_en: enrollment.first_lesson_title_en,
            title_ar: enrollment.first_lesson_title_ar,
          }
        })
        setLastLessons(lastLessonsMap)
      } catch (error) {
        console.error("[v0] Error loading library:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user])

  if (loading) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background">
          <NavBar />
          <main className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <div className="h-10 w-48 bg-muted rounded animate-pulse" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-muted rounded-lg h-96 animate-pulse" />
              ))}
            </div>
          </main>
        </div>
      </RequireAuth>
    )
  }

  const formatLastActivity = (date: string | null) => {
    if (!date) return language === "ar" ? "لم يتم الوصول" : "Not accessed"
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return language === "ar" ? "الآن" : "Just now"
    if (diffMins < 60)
      return `${diffMins}${language === "ar" ? " دقيقة" : " mins"} ${language === "ar" ? "مضت" : "ago"}`
    if (diffHours < 24)
      return `${diffHours}${language === "ar" ? " ساعة" : " hours"} ${language === "ar" ? "مضت" : "ago"}`
    return `${diffDays}${language === "ar" ? " يوم" : " days"} ${language === "ar" ? "مضت" : "ago"}`
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">{t("myLibrary", language)}</h1>

          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="courses">
                <BookOpen className="h-4 w-4 mr-2" />
                {t("courses", language)}
              </TabsTrigger>
              <TabsTrigger value="certificates">
                <Award className="h-4 w-4 mr-2" />
                {language === "ar" ? "الشهادات" : "Certificates"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-6">
              {enrollments.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{language === "ar" ? "لا توجد دورات" : "No courses"}</h3>
                  <p className="text-muted-foreground mb-6">
                    {language === "ar" ? "لم تسجل في أي دورة بعد" : "You haven't enrolled in any courses yet"}
                  </p>
                  <Link href={`/${language}/courses`}>
                    <Button>{language === "ar" ? "تصفح الدورات" : "Browse Courses"}</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrollments.map((enrollment) => {
                    const lastLesson = lastLessons[enrollment.course_id]
                    const lessonId = lastLesson?.id || 1

                    return (
                      <Card key={enrollment.id} className="flex flex-col hover:shadow-lg transition-shadow">
                        <CardHeader className="p-0">
                          <div className="relative h-40 w-full bg-muted rounded-t-lg overflow-hidden">
                            <img
                              src={enrollment.thumbnail_url || "/placeholder.svg?height=160&width=300&query=course"}
                              alt={language === "ar" ? enrollment.title_ar : enrollment.title_en}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>{t(enrollment.difficulty, language)}</Badge>
                          </div>
                          <CardTitle className="text-lg mb-2">
                            {language === "ar" ? enrollment.title_ar : enrollment.title_en}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mb-3">{enrollment.instructor_name}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{language === "ar" ? "التقدم" : "Progress"}</span>
                              <span className="font-semibold">{enrollment.progress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${enrollment.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                              {language === "ar" ? "آخر نشاط: " : "Last activity: "}
                              {formatLastActivity(enrollment.last_accessed_at)}
                            </p>
                          </div>
                        </CardContent>
                        <div className="p-4 pt-0">
                          <Link href={`/${language}/courses/${enrollment.course_id}/learn/${lessonId}`} className="w-full">
                            <Button className="w-full">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              {language === "ar" ? "متابعة التعلم" : "Continue Learning"}
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="certificates" className="mt-6">
              {certificates.length === 0 ? (
                <div className="text-center py-16">
                  <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {language === "ar" ? "لا توجد شهادات" : "No certificates"}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === "ar" ? "أكمل الدورات للحصول على شهادات" : "Complete courses to earn certificates"}
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {certificates.map((cert) => (
                    <Card key={cert.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">
                              {language === "ar"
                                ? cert.title_ar || cert.course_title_ar || cert.contest_title_ar
                                : cert.title_en || cert.course_title_en || cert.contest_title_en}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {language === "ar" ? "صدرت في" : "Issued on"}{" "}
                              {new Date(cert.issued_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <Award className="h-8 w-8 text-primary" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">
                            {language === "ar" ? "رقم الشهادة" : "Certificate Number"}
                          </p>
                          <p className="font-mono font-semibold">{cert.certificate_number}</p>
                        </div>
                        <Button variant="outline" className="w-full bg-transparent">
                          <Download className="mr-2 h-4 w-4" />
                          {language === "ar" ? "تحميل الشهادة" : "Download Certificate"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </RequireAuth>
  )
}
