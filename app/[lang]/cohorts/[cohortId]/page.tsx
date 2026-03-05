"use client"

import { useState, useEffect, use, useCallback } from "react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar, Users, Clock, MapPin, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function CohortDetailPage(props: { params: Promise<{ cohortId: string }> }) {
  const params = use(props.params)
  const { language } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const [cohort, setCohort] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [isMember, setIsMember] = useState(false)

  const fetchCohort = useCallback(async () => {
    try {
      const res = await fetch(`/api/cohorts/${params.cohortId}`)
      if (!res.ok) throw new Error("Failed to fetch cohort")
      const data = await res.json()
      setCohort(data.cohort)

      // Check if user is already a member
      if (user && data.cohort.members) {
        const userMember = data.cohort.members.find((m: any) => m.user_id === user.id)
        setIsMember(!!userMember)
      }
    } catch (error) {
      console.error("[v0] Error fetching cohort:", error)
      toast.error(language === "ar" ? "فشل تحميل الدفعة" : "Failed to load cohort")
    } finally {
      setLoading(false)
    }
  }, [params.cohortId, user, language])

  useEffect(() => {
    fetchCohort()
  }, [fetchCohort])

  async function handleJoin() {
    if (!user) {
      router.push("/auth/login")
      return
    }

    try {
      setJoining(true)
      const res = await fetch(`/api/cohorts/${params.cohortId}/join`, {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to join")
      }

      toast.success(data.message)
      setIsMember(true)
      fetchCohort()
    } catch (error: any) {
      toast.error(error.message || (language === "ar" ? "فشل الانضمام" : "Failed to join"))
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 bg-muted rounded w-1/2 mb-8 animate-pulse"></div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 animate-pulse">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!cohort) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg text-muted-foreground">
            {language === "ar" ? "الدفعة غير موجودة" : "Cohort not found"}
          </p>
        </Card>
      </div>
    )
  }

  const canJoin = cohort.status === "open" && !isMember

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{language === "ar" ? cohort.title_ar : cohort.title_en}</h1>
              <p className="text-muted-foreground">
                {language === "ar" ? "أنشأها" : "Created by"} {cohort.creator_name}
              </p>
            </div>
            <Badge variant={cohort.status === "open" ? "default" : "secondary"} className="text-sm px-3 py-1">
              {cohort.status === "open"
                ? language === "ar"
                  ? "مفتوح للتسجيل"
                  : "Open"
                : cohort.status === "running"
                  ? language === "ar"
                    ? "جارٍ"
                    : "Running"
                  : cohort.status === "ended"
                    ? language === "ar"
                      ? "منتهي"
                      : "Ended"
                    : language === "ar"
                      ? "مسودة"
                      : "Draft"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">{language === "ar" ? "نظرة عامة" : "Overview"}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {language === "ar" ? cohort.description_ar : cohort.description_en}
              </p>
            </Card>

            {cohort.courses && cohort.courses.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">{language === "ar" ? "الدورات المرتبطة" : "Linked Courses"}</h2>
                <div className="space-y-4">
                  {cohort.courses.map((course: any) => (
                    <Link href={`/courses/${course.course_id}`} key={course.id}>
                      <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors">
                        {course.thumbnail_url && (
                          <img
                            src={course.thumbnail_url || "/placeholder.svg"}
                            alt={language === "ar" ? course.title_ar : course.title_en}
                            className="w-16 h-16 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{language === "ar" ? course.title_ar : course.title_en}</h3>
                          <Badge variant="outline" className="mt-1">
                            {course.difficulty}
                          </Badge>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {cohort.schedule && cohort.schedule.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">{language === "ar" ? "الجدول الزمني" : "Schedule"}</h2>
                <div className="space-y-3">
                  {cohort.schedule.map((event: any) => (
                    <div key={event.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{language === "ar" ? event.title_ar : event.title_en}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(event.starts_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <Badge variant="outline">{event.type}</Badge>
                        </div>
                        {event.location_url && (
                          <a
                            href={event.location_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                          >
                            <MapPin className="h-3 w-3" />
                            {language === "ar" ? "رابط الموقع" : "Location Link"}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">{language === "ar" ? "تفاصيل الدفعة" : "Cohort Details"}</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "تاريخ البدء" : "Start Date"}</p>
                    <p className="font-medium">
                      {new Date(cohort.starts_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "تاريخ الانتهاء" : "End Date"}</p>
                    <p className="font-medium">
                      {new Date(cohort.ends_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "الأعضاء" : "Members"}</p>
                    <p className="font-medium">
                      {cohort.members?.filter((m: any) => m.status === "active").length || 0} / {cohort.capacity}
                    </p>
                  </div>
                </div>
              </div>

              {canJoin && (
                <Button onClick={handleJoin} disabled={joining} className="w-full mt-6" size="lg">
                  {joining
                    ? language === "ar"
                      ? "جارٍ الانضمام..."
                      : "Joining..."
                    : language === "ar"
                      ? "انضم الآن"
                      : "Join Now"}
                </Button>
              )}

              {isMember && (
                <Link href={`/cohorts/${params.cohortId}/dashboard`}>
                  <Button className="w-full mt-6" size="lg">
                    {language === "ar" ? "انتقل إلى لوحة التحكم" : "Go to Dashboard"}
                    <ArrowRight className="h-4 w-4 mr-2" />
                  </Button>
                </Link>
              )}
            </Card>

            {cohort.members && cohort.members.length > 0 && (
              <Card className="p-6">
                <h3 className="font-bold mb-4">
                  {language === "ar" ? "المشاركون" : "Participants"} ({cohort.members.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cohort.members.slice(0, 10).map((member: any) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url || "/placeholder.svg"}
                            alt={member.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <span className="text-sm font-medium">{member.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
