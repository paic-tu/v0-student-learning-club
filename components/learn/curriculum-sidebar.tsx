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
import { ScrollArea } from "@/components/ui/scroll-area"

interface CurriculumSidebarProps {
  course: any
  currentLessonId: string
  lang: string
  className?: string
}

export function CurriculumSidebar({ course, currentLessonId, lang, className }: CurriculumSidebarProps) {
  const isAr = lang === "ar"

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
          title={isAr 
            ? (course.titleAr || course.title_ar || course.titleEn || course.title_en) 
            : (course.titleEn || course.title_en || course.titleAr || course.title_ar)}
        >
          {isAr 
            ? (course.titleAr || course.title_ar || course.titleEn || course.title_en) 
            : (course.titleEn || course.title_en || course.titleAr || course.title_ar)}
        </h2>
        <p className="text-xs text-muted-foreground">
          {course.enrollmentCount} {isAr ? "طالب" : "Students"}
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={course.modules.map((m: any) => m.id)} className="w-full">
          {course.modules.map((module: any) => (
            <AccordionItem key={module.id} value={module.id}>
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="text-start w-full">
                  <div className="font-medium text-sm">
                    {isAr 
                      ? (module.titleAr || module.title_ar || module.titleEn || module.title_en) 
                      : (module.titleEn || module.title_en || module.titleAr || module.title_ar)}
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
                          {isAr 
                            ? (lesson.titleAr || lesson.title_ar || lesson.titleEn || lesson.title_en) 
                            : (lesson.titleEn || lesson.title_en || lesson.titleAr || lesson.title_ar)}
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
      </ScrollArea>
    </div>
  )
}
