"use client"

import { cn } from "@/lib/utils"
import { CheckCircle, Circle, PlayCircle, FileText, HelpCircle, Lock } from "lucide-react"
import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface CurriculumSidebarProps {
  course: any
  currentLessonId: string
  lang: string
  className?: string
  onLessonSelect?: () => void
}

export function CurriculumSidebar({ course, currentLessonId, lang, className, onLessonSelect }: CurriculumSidebarProps) {
  const isAr = lang === "ar"

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
      <div className="h-16 flex flex-col justify-center px-4 border-b shrink-0">
        <h2 
          className="font-semibold text-sm line-clamp-1" 
          title={getTitle(course)}
        >
          {getTitle(course)}
        </h2>
        <p className="text-xs text-muted-foreground">
          {course.enrollmentCount} {isAr ? "طالب" : "Students"}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
          <Accordion type="multiple" defaultValue={course.modules.map((m: any) => m.id)} className="w-full">
            {course.modules.map((module: any) => (
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
      </div>
    </div>
  )
}
