import { getCurrentUser } from "@/lib/auth"
import { getLearningData, getUserLessonNotes, getQuizById, getQuizSubmission } from "@/lib/db/queries"
import { redirect, notFound } from "next/navigation"
import { CurriculumSidebar } from "@/components/learn/curriculum-sidebar"
import { MobileCurriculumSidebar } from "@/components/learn/mobile-curriculum-sidebar"
import { LessonContent } from "@/components/learn/lesson-content"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CompleteLessonButton } from "@/components/learn/complete-button"

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

  // Verify sequential progress: Student must complete the previous lesson before accessing the current one
  if (user.role === "student" && prevLessonId && !completedLessons.includes(prevLessonId)) {
    redirect(`/${lang}/student/learn/${courseId}/${prevLessonId}`)
  }

  const lessonNotes = await getUserLessonNotes(user.id, currentLessonAny.id)

  let quiz = null
  let quizSubmission = null

  if (currentLessonAny.contentType === 'quiz' || currentLessonAny.type === 'quiz') {
    const quizId = currentLessonAny.quizConfig?.quizId
    if (quizId) {
      quiz = await getQuizById(quizId)
      quizSubmission = await getQuizSubmission(quizId, user.id)
    }
  }

  const currentLessonMapped = {
    ...currentLessonAny,
    type: currentLessonAny.contentType || currentLessonAny.type,
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
      titleEn: module.title_en ?? module.titleEn,
      titleAr: module.title_ar ?? module.titleAr,
      lessons: module.lessons.map((lesson: any) => ({
        ...lesson,
        titleEn: lesson.title_en ?? lesson.titleEn,
        titleAr: lesson.title_ar ?? lesson.titleAr,
        durationMinutes: lesson.duration_minutes ?? lesson.durationMinutes,
        progress: completedLessons.includes(lesson.id) ? [{ isCompleted: true }] : []
      }))
    }))
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <CurriculumSidebar 
        course={sidebarCourse} 
        currentLessonId={currentLessonAny.id} 
        lang={lang} 
        className="w-80 border-e hidden md:flex"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="flex items-center justify-between h-16 px-4 border-b bg-background shrink-0 gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <MobileCurriculumSidebar 
              course={sidebarCourse} 
              currentLessonId={currentLessonAny.id} 
              lang={lang} 
            />
            
            <Link 
              href={`/${lang}/student/course/${courseAny.id}`}
              className="text-sm font-medium hover:underline text-muted-foreground hover:text-foreground hidden sm:block truncate"
            >
              {isAr ? sidebarCourse.titleAr : sidebarCourse.titleEn}
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!prevLessonId}
              asChild={!!prevLessonId}
            >
              {prevLessonId ? (
                <Link href={`/${lang}/student/learn/${courseAny.id}/${prevLessonId}`}>
                  {isAr ? <ChevronRight className="h-4 w-4 sm:ms-1" /> : <ChevronLeft className="h-4 w-4 sm:me-1" />}
                  <span className="hidden sm:inline">{isAr ? "السابق" : "Previous"}</span>
                </Link>
              ) : (
                <span className="flex items-center">
                  {isAr ? <ChevronRight className="h-4 w-4 sm:ms-1" /> : <ChevronLeft className="h-4 w-4 sm:me-1" />}
                  <span className="hidden sm:inline">{isAr ? "السابق" : "Previous"}</span>
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
              disabled={!nextLessonId || (user.role === "student" && !completedLessons.includes(currentLessonAny.id))}
              asChild={!!nextLessonId && (user.role !== "student" || completedLessons.includes(currentLessonAny.id))}
            >
              {nextLessonId && (user.role !== "student" || completedLessons.includes(currentLessonAny.id)) ? (
                <Link href={`/${lang}/student/learn/${courseAny.id}/${nextLessonId}`}>
                  <span className="hidden sm:inline">{isAr ? "التالي" : "Next"}</span>
                  {isAr ? <ChevronLeft className="h-4 w-4 sm:me-1" /> : <ChevronRight className="h-4 w-4 sm:ms-1" />}
                </Link>
              ) : (
                <span className="flex items-center">
                  <span className="hidden sm:inline">{isAr ? "التالي" : "Next"}</span>
                  {isAr ? <ChevronLeft className="h-4 w-4 sm:me-1" /> : <ChevronRight className="h-4 w-4 sm:ms-1" />}
                </span>
              )}
            </Button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-12">
          <div className="max-w-5xl mx-auto w-full">
            <LessonContent 
              lesson={currentLessonMapped} 
              lang={lang} 
              userId={user.id}
              initialNotes={lessonNotes}
              quiz={quiz}
              quizSubmission={quizSubmission}
              nextUrl={nextLessonId ? `/${lang}/student/learn/${courseAny.id}/${nextLessonId}` : `/${lang}/student/course/${courseAny.id}`}
              courseId={courseAny.id}
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
