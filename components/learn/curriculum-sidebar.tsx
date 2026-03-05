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
}

export function CurriculumSidebar({ course, currentLessonId, lang }: CurriculumSidebarProps) {
  const isAr = lang === "ar"

  const getIcon = (type: string) => {
    switch (type) {
      case "video": return PlayCircle
      case "quiz": return HelpCircle
      default: return FileText
    }
  }

  return (
    <div className="flex flex-col h-full border-r bg-background w-80 shrink-0 hidden md:flex">
      <div className="p-4 border-b">
        <h2 className="font-semibold line-clamp-2">{isAr ? course.titleAr : course.titleEn}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {course.enrollmentCount} {isAr ? "طالب" : "Students"}
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={course.modules.map((m: any) => m.id)} className="w-full">
          {course.modules.map((module: any) => (
            <AccordionItem key={module.id} value={module.id}>
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="text-left">
                  <div className="font-medium text-sm">{isAr ? module.titleAr : module.titleEn}</div>
                  <div className="text-xs text-muted-foreground font-normal mt-0.5">
                    {module.lessons.length} {isAr ? "دروس" : "Lessons"}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="flex flex-col">
                  {module.lessons.map((lesson: any) => {
                    const Icon = getIcon(lesson.type)
                    const isActive = lesson.id === currentLessonId
                    const isCompleted = lesson.progress?.[0]?.isCompleted

                    return (
                      <Link
                        key={lesson.id}
                        href={`/${lang}/student/learn/${course.id}/${lesson.id}`}
                        className={cn(
                          "flex items-center gap-3 px-6 py-3 text-sm transition-colors border-l-2 border-transparent",
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
                        <span className="line-clamp-1 flex-1">
                          {isAr ? lesson.titleAr : lesson.titleEn}
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
