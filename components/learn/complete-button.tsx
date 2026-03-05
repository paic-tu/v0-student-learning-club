"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, Loader2 } from "lucide-react"
import { completeLessonAction } from "@/lib/actions/course"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface CompleteLessonButtonProps {
  courseId: string
  lessonId: string
  isCompleted: boolean
  lang: string
  nextLessonId?: string | null
}

export function CompleteLessonButton({ 
  courseId, 
  lessonId, 
  isCompleted, 
  lang,
  nextLessonId
}: CompleteLessonButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isAr = lang === "ar"

  const handleComplete = () => {
    startTransition(async () => {
      try {
        const result = await completeLessonAction(courseId, lessonId)
        if (result.success) {
          // If there is a next lesson, we could optionally redirect
          // For now, just refresh the state
          if (nextLessonId) {
             router.push(`/${lang}/student/learn/${courseId}/${nextLessonId}`)
          } else {
             router.refresh()
          }
        }
      } catch (error) {
        console.error("Failed to complete lesson", error)
      }
    })
  }

  return (
    <Button
      onClick={handleComplete}
      disabled={isPending || isCompleted}
      variant={isCompleted ? "secondary" : "default"}
      className={cn(
        "gap-2 min-w-[140px]",
        isCompleted && "text-green-600 bg-green-50 hover:bg-green-100 border border-green-200"
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isCompleted ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <Circle className="h-4 w-4" />
      )}
      {isCompleted 
        ? (isAr ? "مكتمل" : "Completed") 
        : (isAr ? "تحديد كمكتمل" : "Mark Complete")
      }
    </Button>
  )
}
