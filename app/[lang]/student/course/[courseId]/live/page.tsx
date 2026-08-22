import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getCourseById } from "@/lib/db/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Video } from "lucide-react"
import LiveClassroomClient from "./client"

export default async function LiveClassroomPage({
  params,
}: {
  params: Promise<{ lang: string; courseId: string }>
}) {
  const { lang, courseId } = await params
  const session = await auth()
  const isAr = lang === "ar"

  if (!session?.user?.id) {
    redirect(`/${lang}/auth/login?callbackUrl=/${lang}/student/course/${courseId}/live`)
  }

  const course = await getCourseById(courseId)

  if (!course?.isStreaming) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "الجلسات المباشرة" : "Live Sessions"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
          <Video className="h-8 w-8" />
          <p>{isAr ? "لا يوجد بث مباشر الآن" : "No live stream right now"}</p>
        </CardContent>
      </Card>
    )
  }

  const roomName = `course-${courseId}`

  return (
    <div className="h-[75vh] rounded-lg border overflow-hidden">
      <LiveClassroomClient
        roomName={roomName}
        user={{
          id: session.user.id,
          name: session.user.name || "User",
          role: session.user.role || "student",
        }}
        isAr={isAr}
      />
    </div>
  )
}
