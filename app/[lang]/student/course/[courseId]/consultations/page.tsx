import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CourseConsultationRoom } from "@/components/student/course/course-consultation-room"

export default async function CourseConsultationsPage(props: { params: Promise<{ lang: string; courseId: string }> }) {
  const { lang, courseId } = await props.params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${lang}/auth/login?callbackUrl=/${lang}/student/course/${courseId}/consultations`)
  }

  const isAr = lang === "ar"
  const roomName = `consultation-${courseId}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{isAr ? "الاستشارات" : "Consultations"}</h1>
        <p className="text-muted-foreground">
          {isAr ? "جلسات استشارية مباشرة خاصة بطلاب هذا الكورس" : "Live consultation sessions for this course's students"}
        </p>
      </div>

      <CourseConsultationRoom
        lang={lang}
        roomName={roomName}
        user={{
          id: session.user.id,
          name: session.user.name || "User",
          role: session.user.role,
          image: session.user.image || undefined,
        }}
      />
    </div>
  )
}
