"use client"

import { useState, useEffect, use } from "react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, BookOpen, Bell, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CohortDashboardPage(props: { params: Promise<{ cohortId: string }> }) {
  const params = use(props.params)
  const { language } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const [cohort, setCohort] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    fetchCohort()
  }, [params.cohortId, user])

  async function fetchCohort() {
    try {
      const res = await fetch(`/api/cohorts/${params.cohortId}`)
      if (!res.ok) throw new Error("Failed to fetch cohort")
      const data = await res.json()

      // Check if user is a member
      const isMember = data.cohort.members?.some((m: any) => m.user_id === user?.id && m.status === "active")
      if (!isMember) {
        router.push(`/cohorts/${params.cohortId}`)
        return
      }

      setCohort(data.cohort)
    } catch (error) {
      console.error("[v0] Error fetching cohort:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 bg-muted rounded w-1/3 mb-8 animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!cohort) {
    return null
  }

  const upcomingEvents = cohort.schedule?.filter((e: any) => new Date(e.starts_at) > new Date()) || []

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">{language === "ar" ? cohort.title_ar : cohort.title_en}</h1>
          <p className="text-muted-foreground">{language === "ar" ? "لوحة تحكم الدفعة" : "Cohort Dashboard"}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">{language === "ar" ? "نظرة عامة" : "Overview"}</TabsTrigger>
            <TabsTrigger value="schedule">{language === "ar" ? "الجدول" : "Schedule"}</TabsTrigger>
            <TabsTrigger value="courses">{language === "ar" ? "الدورات" : "Courses"}</TabsTrigger>
            <TabsTrigger value="announcements">{language === "ar" ? "الإعلانات" : "Announcements"}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "الدورات" : "Courses"}</p>
                    <p className="text-2xl font-bold">{cohort.courses?.length || 0}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "الأعضاء" : "Members"}</p>
                    <p className="text-2xl font-bold">
                      {cohort.members?.filter((m: any) => m.status === "active").length || 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" ? "الأحداث القادمة" : "Upcoming"}
                    </p>
                    <p className="text-2xl font-bold">{upcomingEvents.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <Bell className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "الإعلانات" : "Announcements"}</p>
                    <p className="text-2xl font-bold">{cohort.announcements?.length || 0}</p>
                  </div>
                </div>
              </Card>
            </div>

            {upcomingEvents.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">{language === "ar" ? "الأحداث القادمة" : "Upcoming Events"}</h2>
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 5).map((event: any) => (
                    <div key={event.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{language === "ar" ? event.title_ar : event.title_en}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.starts_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <Badge variant="outline" className="mt-2">
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="schedule">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">{language === "ar" ? "الجدول الزمني الكامل" : "Full Schedule"}</h2>
              {cohort.schedule && cohort.schedule.length > 0 ? (
                <div className="space-y-3">
                  {cohort.schedule.map((event: any) => (
                    <div key={event.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{language === "ar" ? event.title_ar : event.title_en}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {new Date(event.starts_at).toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {(language === "ar" ? event.notes_ar : event.notes_en) && (
                            <p className="text-sm mt-2">{language === "ar" ? event.notes_ar : event.notes_en}</p>
                          )}
                        </div>
                        <Badge variant="outline">{event.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {language === "ar" ? "لا توجد أحداث مجدولة" : "No scheduled events"}
                </p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <div className="grid md:grid-cols-2 gap-6">
              {cohort.courses && cohort.courses.length > 0 ? (
                cohort.courses.map((course: any) => (
                  <Link href={`/courses/${course.course_id}`} key={course.id}>
                    <Card className="p-6 hover:shadow-lg transition-shadow h-full">
                      {course.thumbnail_url && (
                        <img
                          src={course.thumbnail_url || "/placeholder.svg"}
                          alt={language === "ar" ? course.title_ar : course.title_en}
                          className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                      )}
                      <h3 className="text-xl font-bold mb-2">
                        {language === "ar" ? course.title_ar : course.title_en}
                      </h3>
                      <Badge variant="outline">{course.difficulty}</Badge>
                    </Card>
                  </Link>
                ))
              ) : (
                <Card className="p-8 text-center col-span-2">
                  <p className="text-muted-foreground">
                    {language === "ar" ? "لا توجد دورات مرتبطة" : "No linked courses"}
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="announcements">
            <Card className="p-6">
              {cohort.announcements && cohort.announcements.length > 0 ? (
                <div className="space-y-6">
                  {cohort.announcements.map((announcement: any) => (
                    <div
                      key={announcement.id}
                      className={`p-6 rounded-lg border ${announcement.pinned ? "bg-accent" : ""}`}
                    >
                      {announcement.pinned && (
                        <Badge variant="default" className="mb-2">
                          {language === "ar" ? "مثبت" : "Pinned"}
                        </Badge>
                      )}
                      <h3 className="text-xl font-bold mb-2">
                        {language === "ar" ? announcement.title_ar : announcement.title_en}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {language === "ar" ? "بواسطة" : "By"} {announcement.author_name} •{" "}
                        {new Date(announcement.created_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="whitespace-pre-wrap">
                        {language === "ar" ? announcement.body_ar : announcement.body_en}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {language === "ar" ? "لا توجد إعلانات" : "No announcements"}
                </p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
