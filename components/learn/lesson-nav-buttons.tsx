"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CompleteLessonButton } from "@/components/learn/complete-button"

interface LessonNavButtonsProps {
  lang: string
  courseId: string
  currentLessonId: string
  prevLessonId?: string | null
  nextLessonId?: string | null
  isCurrentLessonCompleted?: boolean
  canAdvance?: boolean
  className?: string
}

export function LessonNavButtons({
  lang,
  courseId,
  currentLessonId,
  prevLessonId = null,
  nextLessonId = null,
  isCurrentLessonCompleted = false,
  canAdvance = false,
  className,
}: LessonNavButtonsProps) {
  const isAr = lang === "ar"

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button variant="outline" size="sm" disabled={!prevLessonId} asChild={!!prevLessonId}>
        {prevLessonId ? (
          <Link href={`/${lang}/student/learn/${courseId}/${prevLessonId}`}>
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
        courseId={courseId}
        lessonId={currentLessonId}
        isCompleted={isCurrentLessonCompleted}
        lang={lang}
        nextLessonId={nextLessonId}
      />

      <Button size="sm" disabled={!canAdvance} asChild={canAdvance}>
        {canAdvance ? (
          <Link href={`/${lang}/student/learn/${courseId}/${nextLessonId}`}>
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
  )
}
