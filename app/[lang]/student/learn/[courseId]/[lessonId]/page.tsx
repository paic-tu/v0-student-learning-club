import { getCurrentUser } from "@/lib/auth"
import { getLearningData, getUserLessonNotes, getQuizById, getQuizSubmission } from "@/lib/db/queries"
import { redirect, notFound } from "next/navigation"
import { CurriculumSidebar } from "@/components/learn/curriculum-sidebar"
import { MobileCurriculumSidebar } from "@/components/learn/mobile-curriculum-sidebar"
import { LessonContent } from "@/components/learn/lesson-content"
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

  const [data, lessonNotes] = await Promise.all([
    getLearningData(user.id, courseId, lessonId, user.role),
    getUserLessonNotes(user.id, lessonId)
  ])

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
  const isCurrentLessonCompleted = completedLessons.includes(currentLessonAny.id)
  const canAdvance = Boolean(nextLessonId) && (user.role !== "student" || isCurrentLessonCompleted)

  // Verify sequential progress: Student must complete the previous lesson before accessing the current one
  if (user.role === "student" && prevLessonId && !completedLessons.includes(prevLessonId)) {
    redirect(`/${lang}/student/learn/${courseId}/${prevLessonId}`)
  }

  // const lessonNotes = await getUserLessonNotes(user.id, currentLessonAny.id)

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
    <div dir={isAr ? "rtl" : "ltr"} className="flex h-full overflow-hidden rounded-lg border bg-background">
      {/* Sidebar - Desktop */}
      <CurriculumSidebar
        course={sidebarCourse}
        currentLessonId={currentLessonAny.id}
        lang={lang}
        className="w-80 border-e hidden md:flex"
        progress={progress}
        prevLessonId={prevLessonId}
        nextLessonId={nextLessonId}
        isCurrentLessonCompleted={isCurrentLessonCompleted}
        canAdvance={canAdvance}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile-only: the sidebar (modules, certificate, prev/next/complete)
            lives entirely inside the sheet on small screens now. */}
        <header className="flex items-center h-16 px-4 border-b bg-background shrink-0 md:hidden">
          <MobileCurriculumSidebar
            course={sidebarCourse}
            currentLessonId={currentLessonAny.id}
            lang={lang}
            progress={progress}
            prevLessonId={prevLessonId}
            nextLessonId={nextLessonId}
            isCurrentLessonCompleted={isCurrentLessonCompleted}
            canAdvance={canAdvance}
          />
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-12 scrollbar-hide">
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
