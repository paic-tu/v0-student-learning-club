import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserCourseNotes } from "@/lib/db/queries"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { arSA, enUS } from "date-fns/locale"

export default async function CourseNotesPage(props: { params: Promise<{ lang: string; courseId: string }> }) {
  const { lang, courseId } = await props.params
  const isAr = lang === "ar"
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${lang}/auth/login?callbackUrl=/${lang}/student/course/${courseId}/notes`)
  }

  const notes = await getUserCourseNotes(session.user.id, courseId)

  // Group notes by lesson
  const notesByLesson = notes.reduce((acc, note) => {
    const lessonId = note.lessonId
    if (!acc[lessonId]) {
      const lessonTitle = isAr ? note.lessonTitleAr || note.lessonTitleEn : note.lessonTitleEn || note.lessonTitleAr
      acc[lessonId] = {
        title: lessonTitle || (isAr ? "درس غير معروف" : "Unknown Lesson"),
        notes: [],
      }
    }
    acc[lessonId].notes.push(note)
    return acc
  }, {} as Record<string, { title: string; notes: typeof notes }>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{isAr ? "الملاحظات" : "Notes"}</h1>
        <p className="text-muted-foreground">
          {isAr ? "ملاحظاتك المدونة أثناء هذا الكورس" : "Notes you took while taking this course"}
        </p>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "ملاحظات الدورة" : "Course Notes"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {isAr ? "لم تقم بتدوين أي ملاحظات بعد." : "You haven't taken any notes yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(notesByLesson).map(([lessonId, { title, notes: lessonNotes }]) => (
            <Card key={lessonId}>
              <CardHeader>
                <CardTitle>
                  <Link
                    href={`/${lang}/student/learn/${courseId}/${lessonId}`}
                    className="hover:underline text-primary"
                  >
                    {title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lessonNotes.map((note) => (
                  <div key={note.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-muted-foreground">
                        {note.createdAt &&
                          formatDistanceToNow(new Date(note.createdAt), {
                            addSuffix: true,
                            locale: isAr ? arSA : enUS,
                          })}
                      </span>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap">{note.content}</div>
                    {note.timestamp && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Timestamp: {Math.floor(note.timestamp / 60)}:{(note.timestamp % 60).toString().padStart(2, "0")}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
