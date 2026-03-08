"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, Calendar, Clock, Award } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function MentorDetailPage(props: { params: Promise<{ mentorId: string }> }) {
  const params = use(props.params)
  const { language } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const [mentor, setMentor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)

  const [bookingForm, setBookingForm] = useState({
    startAt: "",
    endAt: "",
    topic: "",
    notes: "",
  })

  useEffect(() => {
    async function fetchMentor() {
      try {
        const res = await fetch(`/api/mentors/${params.mentorId}`)
        if (!res.ok) throw new Error("Failed to fetch mentor")
        const data = await res.json()
        setMentor(data.mentor)
      } catch (error) {
        console.error("[v0] Error fetching mentor:", error)
        toast.error(language === "ar" ? "فشل تحميل بيانات المرشد" : "Failed to load mentor")
      } finally {
        setLoading(false)
      }
    }
    fetchMentor()
  }, [params.mentorId, language])

  async function handleBooking(e: React.FormEvent) {
    e.preventDefault()

    if (!user) {
      router.push("/auth/login")
      return
    }

    try {
      setBookingLoading(true)

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId: mentor.id,
          ...bookingForm,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create booking")
      }

      toast.success(language === "ar" ? "تم إرسال طلب الحجز" : "Booking request sent successfully")
      setBookingOpen(false)
      setBookingForm({ startAt: "", endAt: "", topic: "", notes: "" })
      router.push("/bookings")
    } catch (error: any) {
      toast.error(error.message || (language === "ar" ? "فشل إنشاء الحجز" : "Failed to create booking"))
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="h-10 bg-muted rounded w-1/2 mb-8 animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg text-muted-foreground">{language === "ar" ? "المرشد غير موجود" : "Mentor not found"}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden relative">
              {mentor.avatar_url ? (
                <Image
                  src={mentor.avatar_url || "/placeholder.svg"}
                  alt={mentor.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-4xl font-bold">{mentor.name.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{mentor.name}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  <span className="font-bold text-lg">{Number.parseFloat(mentor.rating || 0).toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({mentor.total_sessions || 0} {language === "ar" ? "جلسة" : "sessions"})
                  </span>
                </div>
                {mentor.hourly_rate && (
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    {mentor.hourly_rate} {language === "ar" ? "ريال/ساعة" : "SAR/hour"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="px-8">
                <Calendar className="h-5 w-5 mr-2" />
                {language === "ar" ? "احجز جلسة" : "Book Session"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === "ar" ? "احجز جلسة إرشادية" : "Book Mentorship Session"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBooking} className="space-y-4">
                <div>
                  <Label>{language === "ar" ? "وقت البدء" : "Start Time"}</Label>
                  <Input
                    type="datetime-local"
                    required
                    value={bookingForm.startAt}
                    onChange={(e) => setBookingForm({ ...bookingForm, startAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === "ar" ? "وقت الانتهاء" : "End Time"}</Label>
                  <Input
                    type="datetime-local"
                    required
                    value={bookingForm.endAt}
                    onChange={(e) => setBookingForm({ ...bookingForm, endAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === "ar" ? "موضوع الجلسة" : "Session Topic"}</Label>
                  <Input
                    required
                    placeholder={
                      language === "ar" ? "مثال: مراجعة كود، مساعدة في مشروع..." : "e.g., Code review, project help..."
                    }
                    value={bookingForm.topic}
                    onChange={(e) => setBookingForm({ ...bookingForm, topic: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === "ar" ? "ملاحظات إضافية" : "Additional Notes"}</Label>
                  <Textarea
                    placeholder={language === "ar" ? "أخبر المرشد بما تحتاجه..." : "Tell the mentor what you need..."}
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  />
                </div>
                <Button type="submit" disabled={bookingLoading} className="w-full">
                  {bookingLoading
                    ? language === "ar"
                      ? "جارٍ الإرسال..."
                      : "Sending..."
                    : language === "ar"
                      ? "إرسال طلب الحجز"
                      : "Send Booking Request"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">{language === "ar" ? "نبذة عني" : "About Me"}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {language === "ar" ? mentor.bio_ar : mentor.bio_en}
              </p>
            </Card>

            {mentor.skills && mentor.skills.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">{language === "ar" ? "المهارات" : "Skills"}</h2>
                <div className="flex flex-wrap gap-2">
                  {mentor.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {mentor.availability && mentor.availability.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">{language === "ar" ? "الأوقات المتاحة" : "Availability"}</h2>
                <div className="space-y-3">
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => {
                    const daySlots = mentor.availability.filter((slot: any) => slot.weekday === index)
                    if (daySlots.length === 0) return null

                    return (
                      <div key={index} className="flex items-start gap-4 p-4 rounded-lg border">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <p className="font-semibold mb-2">
                            {language === "ar"
                              ? ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][index]
                              : day}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {daySlots.map((slot: any) => (
                              <Badge key={slot.id} variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {slot.start_time} - {slot.end_time}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {mentor.reviews && mentor.reviews.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">
                  {language === "ar" ? "التقييمات" : "Reviews"} ({mentor.reviews.length})
                </h2>
                <div className="space-y-6">
                  {mentor.reviews.map((review: any) => (
                    <div key={review.id} className="pb-6 border-b last:border-0 last:pb-0">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden relative">
                          {review.student_avatar ? (
                            <Image
                              src={review.student_avatar || "/placeholder.svg"}
                              alt={review.student_name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="font-medium">{review.student_name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold">{review.student_name}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{review.topic}</p>
                          <p className="text-sm">{language === "ar" ? review.feedback_ar : review.feedback_en}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">{language === "ar" ? "إحصائيات" : "Stats"}</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "التقييم" : "Rating"}</p>
                    <p className="text-2xl font-bold">{Number.parseFloat(mentor.rating || 0).toFixed(1)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" ? "الجلسات المكتملة" : "Completed Sessions"}
                    </p>
                    <p className="text-2xl font-bold">{mentor.completed_sessions || 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" ? "إجمالي الجلسات" : "Total Sessions"}
                    </p>
                    <p className="text-2xl font-bold">{mentor.total_sessions || 0}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
