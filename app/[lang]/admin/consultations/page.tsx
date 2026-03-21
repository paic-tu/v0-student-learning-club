import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import LiveClassroomClient from "@/components/live-classroom-client"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function AdminConsultationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ room?: string }>
}) {
  const { lang } = await params
  const { room } = await searchParams
  const session = await auth()
  const isAr = lang === "ar"

  if (!session?.user?.id) {
    redirect(`/${lang}/auth/login`)
  }

  const role = (session.user as any).role || "student"
  const roomName = room || ""

  if (role === "instructor") {
    const target = roomName ? `/${lang}/instructor/consultations?room=${encodeURIComponent(roomName)}` : `/${lang}/instructor/consultations`
    redirect(target)
  }

  if (role === "student") {
    const target = roomName ? `/${lang}/student/consultations?room=${encodeURIComponent(roomName)}` : `/${lang}/student/consultations`
    redirect(target)
  }

  if (role !== "admin") {
    redirect(`/${lang}/access-denied`)
  }

  if (!roomName) {
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "استشارة تقنية مباشرة" : "Live Tech Consultation"}</CardTitle>
            <CardDescription>
              {isAr
                ? "ادخل الغرفة واطرح سؤالك، ويمكنك رفع اليد للتحدث."
                : "Join the room, ask your question, and raise your hand to speak."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link href={`/${lang}/admin/consultations?room=consultation-tech`}>
                {isAr ? "دخول الاستشارة" : "Join Consultation"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "استشارات مجدولة" : "Scheduled Consultations"}</CardTitle>
            <CardDescription>
              {isAr ? "إدارة بطاقات المستشارين والمواعيد التي تظهر في الصفحة الرئيسية." : "Manage expert cards and time slots shown on the homepage."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href={`/${lang}/admin/consultations/schedule`}>{isAr ? "إدارة الاستشارات" : "Manage Consultations"}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "حجوزات الاستشارات" : "Consultation Bookings"}</CardTitle>
            <CardDescription>
              {isAr ? "عرض الحجوزات المرسلة للمستشارين (حسب المواعيد المجدولة)." : "View bookings created for scheduled consultations."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href={`/${lang}/admin/consultations/bookings`}>{isAr ? "عرض الحجوزات" : "View bookings"}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="-m-8 h-screen">
      <div className="absolute top-4 left-4 z-10">
        <Button asChild variant="secondary">
          <Link href={`/${lang}/admin`}>{isAr ? "رجوع" : "Back"}</Link>
        </Button>
      </div>

      <LiveClassroomClient
        roomName={roomName}
        user={{
          id: session.user.id,
          name: session.user.name || "User",
          role,
          image: session.user.image || undefined,
        }}
        isAr={isAr}
      />
    </div>
  )
}
