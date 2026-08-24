"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Reorder, useDragControls } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { GripVertical, Trash2, PlusCircle, Video, FileText, BookOpen } from "lucide-react"

type LessonRow = {
  id: string
  titleEn: string
  titleAr: string
  type: string
  moduleId: string | null
  orderIndex: number
  isPreview?: boolean | null
}

type ModuleRow = {
  id: string
  titleEn: string
  titleAr: string
  orderIndex: number
}

interface CourseLessonsManagerProps {
  courseId: string
  lang: string
  modules: ModuleRow[]
  initialLessons: LessonRow[]
}

function getLessonIcon(type: string) {
  switch (type) {
    case "video":
      return Video
    case "article":
      return FileText
    default:
      return BookOpen
  }
}

export function CourseLessonsManager({ courseId, lang, modules, initialLessons }: CourseLessonsManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isAr = lang === "ar"

  const [lessons, setLessons] = useState<LessonRow[]>(initialLessons)
  useEffect(() => {
    setLessons(initialLessons)
  }, [initialLessons])

  const [lessonToDelete, setLessonToDelete] = useState<LessonRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const sortedModules = [...modules].sort((a, b) => a.orderIndex - b.orderIndex)

  const groupLessons = (moduleId: string | null) =>
    lessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.orderIndex - b.orderIndex)

  const uncategorized = groupLessons(null)

  async function persistOrder(groupLessonsList: LessonRow[]) {
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: groupLessonsList.map((l, index) => ({ id: l.id, orderIndex: index })),
        }),
      })
      if (!res.ok) throw new Error("Failed to reorder lessons")
      router.refresh()
    } catch {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل حفظ ترتيب الدروس" : "Failed to save lesson order",
        variant: "destructive",
      })
    }
  }

  async function handleReorderGroup(moduleId: string | null, newOrder: LessonRow[]) {
    setLessons((prev) => {
      const others = prev.filter((l) => l.moduleId !== moduleId)
      return [...others, ...newOrder]
    })
    await persistOrder(newOrder)
  }

  async function handleDelete() {
    if (!lessonToDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonToDelete.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete lesson")

      toast({
        title: isAr ? "تم بنجاح" : "Success",
        description: isAr ? "تم حذف الدرس بنجاح" : "Lesson deleted successfully",
      })
      setLessonToDelete(null)
      router.refresh()
    } catch {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل حذف الدرس" : "Failed to delete lesson",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAr ? "الدروس" : "Lessons"}</h1>
        <Button asChild>
          <Link href={`/${lang}/instructor/courses/${courseId}/lessons/new`}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {isAr ? "إنشاء درس جديد" : "Create New Lesson"}
          </Link>
        </Button>
      </div>

      {sortedModules.length === 0 && uncategorized.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {isAr ? "لا توجد دروس بعد." : "No lessons yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedModules.map((m) => (
            <LessonGroup
              key={m.id}
              title={isAr ? m.titleAr || m.titleEn : m.titleEn || m.titleAr}
              lessons={groupLessons(m.id)}
              isAr={isAr}
              lang={lang}
              courseId={courseId}
              onReorder={(order) => handleReorderGroup(m.id, order)}
              onDelete={setLessonToDelete}
            />
          ))}

          {uncategorized.length > 0 && (
            <LessonGroup
              title={isAr ? "دروس غير مصنفة" : "Uncategorized Lessons"}
              lessons={uncategorized}
              isAr={isAr}
              lang={lang}
              courseId={courseId}
              onReorder={(order) => handleReorderGroup(null, order)}
              onDelete={setLessonToDelete}
            />
          )}
        </div>
      )}

      <AlertDialog open={!!lessonToDelete} onOpenChange={(open) => !open && setLessonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "هل أنت متأكد؟" : "Are you sure?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr ? "لا يمكن التراجع عن هذا الإجراء. سيتم حذف الدرس نهائيًا." : "This action cannot be undone. This will permanently delete the lesson."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? (isAr ? "جاري الحذف..." : "Deleting...") : (isAr ? "حذف" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function LessonGroup({
  title,
  lessons,
  isAr,
  lang,
  courseId,
  onReorder,
  onDelete,
}: {
  title: string
  lessons: LessonRow[]
  isAr: boolean
  lang: string
  courseId: string
  onReorder: (order: LessonRow[]) => void
  onDelete: (lesson: LessonRow) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>

      {lessons.length === 0 ? (
        <p className="text-xs text-muted-foreground italic px-1 py-2">
          {isAr ? "لا توجد دروس بهذه الوحدة" : "No lessons in this module"}
        </p>
      ) : (
        <Reorder.Group axis="y" values={lessons} onReorder={onReorder} className="space-y-2">
          {lessons.map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              index={index}
              isAr={isAr}
              lang={lang}
              courseId={courseId}
              onDelete={() => onDelete(lesson)}
            />
          ))}
        </Reorder.Group>
      )}
    </div>
  )
}

function LessonCard({
  lesson,
  index,
  isAr,
  lang,
  courseId,
  onDelete,
}: {
  lesson: LessonRow
  index: number
  isAr: boolean
  lang: string
  courseId: string
  onDelete: () => void
}) {
  const dragControls = useDragControls()
  const Icon = getLessonIcon(lesson.type)

  return (
    <Reorder.Item value={lesson} dragListener={false} dragControls={dragControls}>
      <Card>
        <CardContent className="flex items-center gap-3 p-3">
          <button
            type="button"
            onPointerDown={(e) => dragControls.start(e)}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
            aria-label={isAr ? "سحب لإعادة الترتيب" : "Drag to reorder"}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <Badge variant="outline" className="shrink-0">
            {index + 1}
          </Badge>

          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

          <Link
            href={`/${lang}/instructor/courses/${courseId}/lessons/${lesson.id}/edit`}
            className="flex-1 min-w-0 truncate text-sm hover:underline"
          >
            {isAr ? lesson.titleAr || lesson.titleEn : lesson.titleEn || lesson.titleAr}
          </Link>

          {lesson.isPreview && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">
              {isAr ? "مجاني" : "Free"}
            </Badge>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
            aria-label={isAr ? "حذف" : "Delete"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </Reorder.Item>
  )
}
