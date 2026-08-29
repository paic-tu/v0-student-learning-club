"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { CheckCircle, Circle, PlayCircle, FileText, HelpCircle, Lock, Award, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getOrCreateCertificate } from "@/lib/actions/certificate"
import { CompleteLessonButton } from "@/components/learn/complete-button"

interface CurriculumSidebarProps {
  course: any
  currentLessonId: string
  lang: string
  className?: string
  onLessonSelect?: () => void
  progress?: number
  prevLessonId?: string | null
  nextLessonId?: string | null
  isCurrentLessonCompleted?: boolean
  canAdvance?: boolean
}

function openModulesStorageKey(courseId: string) {
  return `curriculum-open-modules-${courseId}`
}

function readStoredOpenModules(courseId: string): string[] | null {
  try {
    const raw = window.localStorage.getItem(openModulesStorageKey(courseId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function findModuleIdForLesson(course: any, lessonId: string): string | undefined {
  return course.modules?.find((m: any) => m.lessons?.some((l: any) => l.id === lessonId))?.id
}

// Client-only: merges the module containing the current lesson into whatever
// the user previously had open, never dropping anything they opened manually.
function computeOpenModules(course: any, currentLessonId: string): string[] {
  const firstModuleId = course.modules?.[0]?.id
  const stored = readStoredOpenModules(course.id)

  if (!stored) {
    return firstModuleId ? [firstModuleId] : []
  }

  const currentModuleId = findModuleIdForLesson(course, currentLessonId)
  if (currentModuleId && !stored.includes(currentModuleId)) {
    return [...stored, currentModuleId]
  }
  return stored
}

export function CurriculumSidebar({
  course,
  currentLessonId,
  lang,
  className,
  onLessonSelect,
  progress = 0,
  prevLessonId = null,
  nextLessonId = null,
  isCurrentLessonCompleted = false,
  canAdvance = false,
}: CurriculumSidebarProps) {
  const isAr = lang === "ar"
  const router = useRouter()
  const { toast } = useToast()
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false)
  const isCourseComplete = progress === 100

  // Guards only against a rapid double-click on this button — the underlying
  // getOrCreateCertificate() race (e.g. two separate tabs) is a known,
  // separate issue left unfixed by explicit decision.
  const handleGenerateCertificate = async () => {
    if (isGeneratingCertificate || !isCourseComplete) return
    setIsGeneratingCertificate(true)
    try {
      const result = await getOrCreateCertificate(course.id)
      router.push(`/${lang}/student/certificates?highlight=${encodeURIComponent(result.certificateNumber)}`)
    } catch (error) {
      console.error("Failed to generate certificate:", error)
      setIsGeneratingCertificate(false)
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "تعذّر إصدار الشهادة. حاول مرة أخرى." : "Couldn't generate the certificate. Please try again.",
      })
    }
  }

  // SSR/first paint always uses the "first module only" fallback (no access
  // to localStorage yet) to avoid a hydration mismatch; once mounted we read
  // the real per-course state and remount the Accordion with it below.
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  const openModules = useMemo(() => {
    if (!isMounted) {
      return course.modules?.[0] ? [course.modules[0].id] : []
    }
    return computeOpenModules(course, currentLessonId)
  }, [isMounted, course, currentLessonId])

  useEffect(() => {
    if (!isMounted) return
    try {
      window.localStorage.setItem(openModulesStorageKey(course.id), JSON.stringify(openModules))
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }
  }, [isMounted, course.id, openModules])

  const handleOpenModulesChange = (value: string[]) => {
    try {
      window.localStorage.setItem(openModulesStorageKey(course.id), JSON.stringify(value))
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }
  }

  // Helper to safely access properties that might be camelCase or snake_case
  const getProp = (obj: any, camel: string, snake: string) => {
    if (!obj) return undefined
    return obj[camel] !== undefined ? obj[camel] : obj[snake]
  }

  const getTitle = (item: any) => {
    if (!item) return ""
    const ar = getProp(item, "titleAr", "title_ar")
    const en = getProp(item, "titleEn", "title_en")
    return isAr ? (ar || en || "بدون عنوان") : (en || ar || "Untitled")
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "video": return PlayCircle
      case "quiz": return HelpCircle
      default: return FileText
    }
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className={cn("flex flex-col h-full bg-background shrink-0", className)}>
      <div className="h-16 flex items-center px-4 border-b shrink-0">
        <span className="text-sm font-bold text-muted-foreground">
          {isAr ? "محتوى الدورة" : "Course Content"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
          {course.isLive && (
            <Link
              href={`/${lang}/student/course/${course.id}/live`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 border-b hover:bg-red-50/50 transition-colors",
                currentLessonId === "live" && "bg-red-50 text-red-600 border-l-4 border-l-red-600"
              )}
            >
              <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </div>
              <div className="flex-1 font-medium text-red-600">
                {isAr ? "البث المباشر" : "Live Stream"}
              </div>
            </Link>
          )}

          <Accordion
            key={isMounted ? "client" : "ssr"}
            type="multiple"
            defaultValue={openModules}
            onValueChange={handleOpenModulesChange}
            className="w-full"
          >
            {course.modules?.map((module: any) => (
              <AccordionItem key={module.id} value={module.id}>
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                  <div className="text-start w-full">
                    <div className="font-medium text-sm">
                      {getTitle(module)}
                    </div>
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">
                      {module.lessons?.length || 0} {isAr ? "دروس" : "Lessons"}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="flex flex-col">
                    {module.lessons?.map((lesson: any) => {
                      const Icon = getIcon(lesson.type)
                      const isActive = lesson.id === currentLessonId
                      const isCompleted = lesson.progress?.[0]?.isCompleted

                      return (
                        <Link
                          key={lesson.id}
                          href={`/${lang}/student/learn/${course.id}/${lesson.id}`}
                          onClick={onLessonSelect}
                          className={cn(
                            "flex items-center gap-3 px-6 py-3 text-sm transition-colors border-s-4 border-transparent",
                            isActive 
                              ? "bg-primary/10 border-primary text-primary font-medium" 
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                          )}
                          <span className="line-clamp-1 flex-1 text-start">
                            {getTitle(lesson)}
                          </span>
                          {lesson.durationMinutes && (
                            <span className="text-xs text-muted-foreground/70">
                              {lesson.durationMinutes}m
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="p-4 border-t">
            <Button
              className="w-full"
              disabled={!isCourseComplete || isGeneratingCertificate}
              onClick={handleGenerateCertificate}
            >
              {isGeneratingCertificate ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  {isAr ? "جاري الإصدار..." : "Generating..."}
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 me-2" />
                  {isAr ? "شهادة اتمام الدورة" : "Course Completion Certificate"}
                </>
              )}
            </Button>
          </div>
      </div>

      <div className="border-t p-4 shrink-0 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!prevLessonId}
          asChild={!!prevLessonId}
        >
          {prevLessonId ? (
            <Link href={`/${lang}/student/learn/${course.id}/${prevLessonId}`}>
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
          courseId={course.id}
          lessonId={currentLessonId}
          isCompleted={isCurrentLessonCompleted}
          lang={lang}
          nextLessonId={nextLessonId}
        />

        <Button
          size="sm"
          disabled={!canAdvance}
          asChild={canAdvance}
        >
          {canAdvance ? (
            <Link href={`/${lang}/student/learn/${course.id}/${nextLessonId}`}>
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
    </div>
  )
}
