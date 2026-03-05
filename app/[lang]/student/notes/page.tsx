import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserNotes } from "@/lib/db/queries"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { arSA, enUS } from "date-fns/locale"

export default async function NotesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect(`/${lang}/login`)
  }
  
  const notes = await getUserNotes(session.user.id)
  
  // Group notes by course
  const notesByCourse = notes.reduce((acc, note) => {
    const courseId = note.courseId || 'unknown'
    if (!acc[courseId]) {
      acc[courseId] = {
        title: lang === 'ar' ? (note.courseTitleAr || note.courseTitleEn) : (note.courseTitleEn || note.courseTitleAr),
        notes: []
      }
    }
    acc[courseId].notes.push(note)
    return acc
  }, {} as Record<string, { title: string, notes: typeof notes }>)

  const isAr = lang === 'ar'
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{isAr ? 'ملاحظاتي' : 'My Notes'}</h1>
      
      {notes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'ملاحظات الدورة' : 'Course Notes'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {isAr ? 'لم تقم بتدوين أي ملاحظات بعد.' : "You haven't taken any notes yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(notesByCourse).map(([courseId, { title, notes: courseNotes }]) => (
            <Card key={courseId}>
              <CardHeader>
                <CardTitle>{title || (isAr ? 'دورة غير معروفة' : 'Unknown Course')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {courseNotes.map((note) => (
                  <div key={note.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">
                        <Link 
                          href={`/${lang}/student/learn/${courseId}/${note.lessonId}`}
                          className="hover:underline text-primary"
                        >
                          {isAr ? (note.lessonTitleAr || note.lessonTitleEn) : (note.lessonTitleEn || note.lessonTitleAr)}
                        </Link>
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {note.createdAt && formatDistanceToNow(new Date(note.createdAt), { 
                          addSuffix: true,
                          locale: isAr ? arSA : enUS 
                        })}
                      </span>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap">
                      {note.content}
                    </div>
                    {note.timestamp && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Timestamp: {Math.floor(note.timestamp / 60)}:{(note.timestamp % 60).toString().padStart(2, '0')}
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
