"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { completeLessonAction } from "@/lib/actions"
import { RatingModal } from "@/components/rating-modal"
import { Check, CheckCircle, Circle, Menu, ChevronLeft, ChevronRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export function LessonPlayerClient({ 
  course, 
  lesson, 
  allLessons,
  completedLessonIds 
}: { 
  course: any, 
  lesson: any, 
  allLessons: any[],
  completedLessonIds: string[]
}) {
  const { language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)

  const isCompleted = completedLessonIds.includes(lesson.id)

  const currentLessonIndex = allLessons.findIndex(l => l.id === lesson.id)
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null

  const handleComplete = async () => {
    setCompleting(true)
    try {
      const result = await completeLessonAction(course.id, lesson.id)
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to complete lesson"
        })
      } else {
        toast({
          title: "Lesson Completed",
          description: "Great job! Keep going."
        })
        if (result.progress === 100) {
          setShowRatingModal(true)
        }
        router.refresh()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 border-r bg-card transition-transform duration-300 md:relative md:translate-x-0",
          !sidebarOpen && "-translate-x-full md:hidden"
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <Link href={`/${language}/courses/${course.id}`} className="flex items-center gap-2 font-semibold">
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            {t("courseDetails", language)}
          </Link>
        </div>
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="p-4">
            <h3 className="mb-4 font-semibold">{language === "ar" ? course.title_ar : course.title_en}</h3>
            <div className="space-y-1">
              {allLessons.map((l, index) => {
                const isCompleted = completedLessonIds.includes(l.id)
                const isActive = l.id === lesson.id
                return (
                  <Link 
                    key={l.id} 
                    href={`/${language}/courses/${course.id}/learn/${l.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                      isActive && "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="line-clamp-1">{index + 1}. {language === "ar" ? l.title_ar : l.title_en}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex h-14 items-center justify-between border-b px-4 lg:px-8">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center font-medium truncate px-4">
             {language === "ar" ? lesson.title_ar : lesson.title_en}
          </div>
          <div className="w-10" /> {/* Spacer */}
        </header>

        <ScrollArea className="flex-1 p-4 lg:p-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                {/* Video Player */}
                {lesson.video_url ? (
                   <iframe src={lesson.video_url} className="absolute inset-0 w-full h-full" allowFullScreen />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white">No Video</div>
                )}
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <h3>{t("description", language)}</h3>
              <p>{language === "ar" ? lesson.content_ar : lesson.content_en}</p>
            </div>

            <div className="flex justify-between items-center pt-8 pb-10">
               {prevLesson ? (
                 <Link href={`/${language}/courses/${course.id}/learn/${prevLesson.id}`}>
                   <Button variant="outline">
                     <ChevronLeft className="h-4 w-4 mr-2 rtl:rotate-180" />
                     {t("previous", language)}
                   </Button>
                 </Link>
               ) : <div />}

               <Button 
                 onClick={handleComplete} 
                 disabled={isCompleted || completing}
                 variant={isCompleted ? "secondary" : "default"}
                 className="mx-4"
               >
                 {isCompleted ? (
                   <>
                     <Check className="h-4 w-4 mr-2" />
                     {t("markComplete", language)}
                   </>
                 ) : (
                   <>
                     {completing ? "..." : t("markComplete", language)}
                   </>
                 )}
               </Button>
               
               {nextLesson ? (
                 <Link href={`/${language}/courses/${course.id}/learn/${nextLesson.id}`}>
                   <Button>
                     {t("next", language)}
                     <ChevronRight className="h-4 w-4 ml-2 rtl:rotate-180" />
                   </Button>
                 </Link>
               ) : <div />}
            </div>

            <div className="flex justify-center pb-8">
              <Button variant="outline" onClick={() => setShowRatingModal(true)}>
                <Star className="w-4 h-4 mr-2" />
                {language === "ar" ? "تقييم الدورة" : "Rate Course"}
              </Button>
            </div>

            <RatingModal 
              isOpen={showRatingModal} 
              onClose={() => setShowRatingModal(false)}
              courseId={course.id}
              courseTitle={language === "ar" ? course.title_ar : course.title_en}
            />
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}
