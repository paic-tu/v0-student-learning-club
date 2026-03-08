"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function BookingsPage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const [studentBookings, setStudentBookings] = useState<any[]>([])
  const [mentorBookings, setMentorBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBookings() {
      try {
        const [studentRes, mentorRes] = await Promise.all([
          fetch("/api/bookings?role=student"),
          fetch("/api/bookings?role=mentor"),
        ])

        const studentData = await studentRes.json()
        const mentorData = await mentorRes.json()

        setStudentBookings(studentData.bookings || [])
        setMentorBookings(mentorData.bookings || [])
      } catch (error) {
        console.error("[v0] Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!user) {
      router.push(`/${language}/auth/login`)
      return
    }
    fetchBookings()
  }, [user, language, router])

  const getStatusBadge = (status: string) => {
    const config: Record<string, any> = {
      requested: {
        variant: "secondary",
        icon: AlertCircle,
        label: language === "ar" ? "قيد الانتظار" : "Requested",
      },
      confirmed: {
        variant: "default",
        icon: CheckCircle2,
        label: language === "ar" ? "مؤكد" : "Confirmed",
      },
      completed: { variant: "outline", icon: CheckCircle2, label: language === "ar" ? "مكتمل" : "Completed" },
      cancelled: { variant: "destructive", icon: XCircle, label: language === "ar" ? "ملغي" : "Cancelled" },
    }

    const { variant, icon: Icon, label } = config[status] || config.requested

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">{language === "ar" ? "جلساتي" : "My Bookings"}</h1>
          <p className="text-muted-foreground text-lg">
            {language === "ar" ? "إدارة جلساتك الإرشادية" : "Manage your mentorship sessions"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="student" className="space-y-6">
          <TabsList>
            <TabsTrigger value="student">
              {language === "ar" ? "كطالب" : "As Student"} ({studentBookings.length})
            </TabsTrigger>
            <TabsTrigger value="mentor">
              {language === "ar" ? "كمرشد" : "As Mentor"} ({mentorBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="student" className="space-y-4">
            {loading ? (
              <Card className="p-6 animate-pulse">
                <div className="h-20 bg-muted rounded"></div>
              </Card>
            ) : studentBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  {language === "ar" ? "لا توجد جلسات محجوزة" : "No bookings yet"}
                </p>
                <Link href="/mentors">
                  <Button>{language === "ar" ? "تصفح المرشدين" : "Browse Mentors"}</Button>
                </Link>
              </Card>
            ) : (
              studentBookings.map((booking: any) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden relative shrink-0">
                        {booking.mentor_avatar ? (
                          <Image
                            src={booking.mentor_avatar || "/placeholder.svg"}
                            alt={booking.mentor_name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <User className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{booking.topic}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {language === "ar" ? "مع" : "with"} {booking.mentor_name}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(booking.start_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {new Date(booking.start_at).toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {booking.notes && (
                    <p className="text-sm text-muted-foreground mb-4 p-3 bg-muted rounded-lg">{booking.notes}</p>
                  )}

                  {booking.meeting_url && (
                    <a href={booking.meeting_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full bg-transparent">
                        {language === "ar" ? "انضم إلى الجلسة" : "Join Session"}
                      </Button>
                    </a>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="mentor" className="space-y-4">
            {loading ? (
              <Card className="p-6 animate-pulse">
                <div className="h-20 bg-muted rounded"></div>
              </Card>
            ) : mentorBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  {language === "ar" ? "لا توجد طلبات حجز" : "No booking requests"}
                </p>
              </Card>
            ) : (
              mentorBookings.map((booking: any) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden relative shrink-0">
                        {booking.student_avatar ? (
                          <Image
                            src={booking.student_avatar || "/placeholder.svg"}
                            alt={booking.student_name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <User className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{booking.topic}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {language === "ar" ? "من" : "from"} {booking.student_name}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(booking.start_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {new Date(booking.start_at).toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {booking.notes && (
                    <p className="text-sm text-muted-foreground mb-4 p-3 bg-muted rounded-lg">{booking.notes}</p>
                  )}

                  {booking.status === "requested" && (
                    <div className="flex gap-2">
                      <Button variant="default" className="flex-1">
                        {language === "ar" ? "قبول" : "Accept"}
                      </Button>
                      <Button variant="outline" className="flex-1 bg-transparent">
                        {language === "ar" ? "رفض" : "Decline"}
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
