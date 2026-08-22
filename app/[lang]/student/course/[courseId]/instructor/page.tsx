import { getCourseById } from "@/lib/db/queries"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import Link from "next/link"

export default async function CourseInstructorPage(props: { params: Promise<{ lang: string; courseId: string }> }) {
  const { lang, courseId } = await props.params
  const isAr = lang === "ar"

  const course = await getCourseById(courseId)
  const instructor = (course as any)?.instructor as
    | { name: string; avatarUrl: string | null; bio: string | null; headline: string | null }
    | undefined

  if (!instructor) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {isAr ? "لا توجد بيانات عن المدرب حالياً." : "No instructor information available yet."}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{isAr ? "المدرب" : "Instructor"}</h1>
        <p className="text-muted-foreground">
          {isAr ? "تعرّف على مدرب هذا الكورس" : "Meet this course's instructor"}
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:items-start sm:text-start">
          <Avatar className="h-24 w-24 border">
            <AvatarImage src={instructor.avatarUrl || undefined} alt={instructor.name} />
            <AvatarFallback className="text-2xl">{instructor.name?.[0]}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h2 className="text-xl font-bold">{instructor.name}</h2>
              {instructor.headline && (
                <p className="text-muted-foreground">{instructor.headline}</p>
              )}
            </div>

            {instructor.bio && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{instructor.bio}</p>
            )}

            <Button asChild className="gap-2">
              <Link href={`/${lang}/student/course/${courseId}/chat`}>
                <MessageCircle className="h-4 w-4" />
                {isAr ? "تواصل مع المدرب" : "Message Instructor"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
