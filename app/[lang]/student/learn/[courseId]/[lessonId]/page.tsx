import { getCurrentUser } from "@/lib/auth"
import { getLearningData, getUserLessonNotes } from "@/lib/db/queries"
import { redirect, notFound } from "next/navigation"
import { CurriculumSidebar } from "@/components/learn/curriculum-sidebar"
import { LessonContent } from "@/components/learn/lesson-content"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CompleteLessonButton } from "@/components/learn/complete-button"
import { CertificateDownloadButton } from "@/components/certificate/certificate-download-button"

export default async function LearningPage({ 
  params 
}: { 
  params: Promise<{ lang: string; courseId: string; lessonId: string }> 
}) {
  const { lang, courseId, lessonId } = await params
  const user = await getCurrentUser()
  
  if (!user || !["student", "instructor", "admin"].includes(user.role)) {
    // redirect(`/${lang}/auth/login`)
    return null
  }

  const data = await getLearningData(user.id, courseId, lessonId, user.role)

  if (data.error || !data.course || !data.currentLesson) {
    // Handle specific errors (not enrolled vs not found)
    if (data.error === "Not enrolled") {
      redirect(`/${lang}/courses/${courseId}`)
    }
    return notFound()
  }

  const { course, courseContent, currentLesson, userProgress, navigation } = data
  const isAr = lang === "ar"
  const courseAny = course as any
  const currentLessonAny = currentLesson as any
  const completedLessons = (userProgress as any)?.completedLessons ?? []
  const progress = (userProgress as any)?.progress ?? 0
  const prevLessonId = (navigation as any)?.prev?.id ?? null
  const nextLessonId = (navigation as any)?.next?.id ?? null

  const lessonNotes = await getUserLessonNotes(user.id, currentLessonAny.id)

  const currentLessonMapped = {
    ...currentLessonAny,
    titleEn: currentLessonAny.title_en ?? currentLessonAny.titleEn,
    titleAr: currentLessonAny.title_ar ?? currentLessonAny.titleAr,
    descriptionEn: currentLessonAny.description_en ?? currentLessonAny.descriptionEn,
    descriptionAr: currentLessonAny.description_ar ?? currentLessonAny.descriptionAr,
    contentEn: currentLessonAny.content_en ?? currentLessonAny.contentEn,
    contentAr: currentLessonAny.content_ar ?? currentLessonAny.contentAr,
    videoUrl: currentLessonAny.video_url ?? currentLessonAny.videoUrl,
    thumbnailUrl: currentLessonAny.thumbnail_url ?? currentLessonAny.thumbnailUrl,
    durationMinutes: currentLessonAny.duration_minutes ?? currentLessonAny.durationMinutes,
  }

  // Transform data for CurriculumSidebar
  const sidebarCourse = {
    ...courseAny,
    titleEn: courseAny.title_en ?? courseAny.titleEn,
    titleAr: courseAny.title_ar ?? courseAny.titleAr,
    modules: courseContent.map((module: any) => ({
      ...module,
      titleEn: module.title_en,
      titleAr: module.title_ar,
      lessons: module.lessons.map((lesson: any) => ({
        ...lesson,
        titleEn: lesson.title_en,
        titleAr: lesson.title_ar,
        durationMinutes: lesson.duration_minutes,
        progress: completedLessons.includes(lesson.id) ? [{ isCompleted: true }] : []
      }))
    }))
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <CurriculumSidebar 
        course={sidebarCourse} 
        currentLessonId={currentLessonAny.id} 
        lang={lang} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="flex items-center justify-between h-16 px-4 border-b bg-background shrink-0">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <CurriculumSidebar 
                  course={sidebarCourse} 
                  currentLessonId={currentLessonAny.id} 
                  lang={lang} 
                />
              </SheetContent>
            </Sheet>
            
            <Link 
              href={`/${lang}/student/course/${courseAny.id}`}
              className="text-sm font-medium hover:underline text-muted-foreground hover:text-foreground hidden sm:block"
            >
              {isAr ? sidebarCourse.titleAr : sidebarCourse.titleEn}
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Certificate Button */}
            {progress === 100 && (
              <CertificateDownloadButton 
                studentName={user.name || "Student"}
                courseName={isAr ? courseAny.title_ar : courseAny.title_en}
                instructorName={courseAny.instructor_name || "Mohsen Alghamdi"}
                completionDate={new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                className="mr-2"
              />
            )}

            <Button 
              variant="outline" 
              size="sm" 
              disabled={!prevLessonId}
              asChild={!!prevLessonId}
            >
              {prevLessonId ? (
                <Link href={`/${lang}/student/learn/${courseAny.id}/${prevLessonId}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {isAr ? "السابق" : "Previous"}
                </Link>
              ) : (
                <span>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {isAr ? "السابق" : "Previous"}
                </span>
              )}
            </Button>
            
            <CompleteLessonButton 
              courseId={courseAny.id}
              lessonId={currentLessonAny.id}
              isCompleted={completedLessons.includes(currentLessonAny.id)}
              lang={lang}
              nextLessonId={nextLessonId}
            />

            <Button 
              size="sm" 
              disabled={!nextLessonId}
              asChild={!!nextLessonId}
            >
              {nextLessonId ? (
                <Link href={`/${lang}/student/learn/${courseAny.id}/${nextLessonId}`}>
                  {isAr ? "التالي" : "Next"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              ) : (
                <span>
                  {isAr ? "التالي" : "Next"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </span>
              )}
            </Button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <LessonContent 
              lesson={currentLessonMapped} 
              lang={lang} 
              userId={user.id}
              initialNotes={lessonNotes}
            />
            
            {/* Action Bar (Complete, Notes) */}
            <div className="mt-12 pt-8 border-t flex justify-between items-center">
               <div className="text-sm text-muted-foreground">
                 {/* Last updated: {new Date(currentLesson.updatedAt).toLocaleDateString()} */}
               </div>
               <CompleteLessonButton 
                  courseId={courseAny.id}
                  lessonId={currentLessonAny.id}
                  isCompleted={completedLessons.includes(currentLessonAny.id)}
                  lang={lang}
                  nextLessonId={nextLessonId}
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
