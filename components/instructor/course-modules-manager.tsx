"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Reorder, useDragControls } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { GripVertical, Pencil, Trash2, PlusCircle, BookOpen, ListVideo } from "lucide-react"

type ModuleWithLessons = {
  id: string
  titleEn: string
  titleAr: string
  orderIndex: number
  lessons?: { id: string }[]
}

interface CourseModulesManagerProps {
  courseId: string
  lang: string
  initialModules: ModuleWithLessons[]
}

export function CourseModulesManager({ courseId, lang, initialModules }: CourseModulesManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isAr = lang === "ar"

  const [modules, setModules] = useState<ModuleWithLessons[]>(
    [...initialModules].sort((a, b) => a.orderIndex - b.orderIndex),
  )
  useEffect(() => {
    setModules([...initialModules].sort((a, b) => a.orderIndex - b.orderIndex))
  }, [initialModules])

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [titleEn, setTitleEn] = useState("")
  const [titleAr, setTitleAr] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [editModule, setEditModule] = useState<ModuleWithLessons | null>(null)
  const [editTitleEn, setEditTitleEn] = useState("")
  const [editTitleAr, setEditTitleAr] = useState("")

  const [moduleToDelete, setModuleToDelete] = useState<ModuleWithLessons | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function persistOrder(newOrder: ModuleWithLessons[]) {
    try {
      await Promise.all(
        newOrder.map((m, index) =>
          fetch(`/api/courses/${courseId}/modules/${m.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: index }),
          }),
        ),
      )
      router.refresh()
    } catch {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل حفظ الترتيب الجديد" : "Failed to save the new order",
        variant: "destructive",
      })
    }
  }

  async function handleReorder(newOrder: ModuleWithLessons[]) {
    setModules(newOrder)
    await persistOrder(newOrder)
  }

  async function handleCreate() {
    if (!titleEn || !titleAr) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "يرجى إدخال العنوان باللغتين الإنجليزية والعربية" : "Please enter both English and Arabic titles",
        variant: "destructive",
      })
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title_en: titleEn, title_ar: titleAr }),
      })
      if (!res.ok) throw new Error("Failed to create module")

      toast({
        title: isAr ? "تم بنجاح" : "Success",
        description: isAr ? "تم إنشاء الوحدة بنجاح" : "Module created successfully",
      })
      setIsCreateOpen(false)
      setTitleEn("")
      setTitleAr("")
      router.refresh()
    } catch {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل إنشاء الوحدة" : "Failed to create module",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  function openEdit(m: ModuleWithLessons) {
    setEditModule(m)
    setEditTitleEn(m.titleEn || "")
    setEditTitleAr(m.titleAr || "")
  }

  async function handleUpdate() {
    if (!editModule || !editTitleEn || !editTitleAr) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/modules/${editModule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title_en: editTitleEn, title_ar: editTitleAr }),
      })
      if (!res.ok) throw new Error("Failed to update module")

      toast({
        title: isAr ? "تم بنجاح" : "Success",
        description: isAr ? "تم تحديث الوحدة بنجاح" : "Module updated successfully",
      })
      setEditModule(null)
      router.refresh()
    } catch {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل تحديث الوحدة" : "Failed to update module",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!moduleToDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/modules/${moduleToDelete.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete module")

      toast({
        title: isAr ? "تم بنجاح" : "Success",
        description: isAr ? "تم حذف الوحدة بنجاح" : "Module deleted successfully",
      })
      setModuleToDelete(null)
      router.refresh()
    } catch {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل حذف الوحدة" : "Failed to delete module",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAr ? "الوحدات" : "Modules"}</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {isAr ? "إضافة وحدة" : "Add Module"}
        </Button>
      </div>

      {modules.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {isAr ? "لا توجد وحدات بعد." : "No modules yet."}
          </CardContent>
        </Card>
      ) : (
        <Reorder.Group axis="y" values={modules} onReorder={handleReorder} className="space-y-3">
          {modules.map((m, index) => (
            <ModuleCard
              key={m.id}
              module={m}
              index={index}
              isAr={isAr}
              lang={lang}
              courseId={courseId}
              onEdit={() => openEdit(m)}
              onDelete={() => setModuleToDelete(m)}
            />
          ))}
        </Reorder.Group>
      )}

      {/* Create Module Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "إنشاء وحدة" : "Create Module"}</DialogTitle>
            <DialogDescription>{isAr ? "أضف قسماً جديداً لتنظيم دروسك." : "Add a new section to organize your lessons."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isAr ? "العنوان بالإنجليزية" : "English Title"}</Label>
              <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder={isAr ? "عنوان الوحدة بالإنجليزية" : "Module title in English"} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "العنوان بالعربية" : "Arabic Title"}</Label>
              <Input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} placeholder={isAr ? "عنوان الوحدة بالعربية" : "Module title in Arabic"} dir="rtl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={!!editModule} onOpenChange={(open) => !open && setEditModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "تعديل الوحدة" : "Edit Module"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isAr ? "العنوان بالإنجليزية" : "English Title"}</Label>
              <Input value={editTitleEn} onChange={(e) => setEditTitleEn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "العنوان بالعربية" : "Arabic Title"}</Label>
              <Input value={editTitleAr} onChange={(e) => setEditTitleAr(e.target.value)} dir="rtl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModule(null)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleUpdate} disabled={isSaving}>
              {isSaving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!moduleToDelete} onOpenChange={(open) => !open && setModuleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "هل أنت متأكد؟" : "Are you sure?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? "سيؤدي هذا الإجراء إلى حذف الوحدة وجميع الدروس بداخلها. لا يمكن التراجع عن هذا الإجراء."
                : "This action cannot be undone. This will permanently delete the module and all lessons within it."}
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

function ModuleCard({
  module,
  index,
  isAr,
  lang,
  courseId,
  onEdit,
  onDelete,
}: {
  module: ModuleWithLessons
  index: number
  isAr: boolean
  lang: string
  courseId: string
  onEdit: () => void
  onDelete: () => void
}) {
  const dragControls = useDragControls()
  const lessonsCount = module.lessons?.length ?? 0

  return (
    <Reorder.Item value={module} dragListener={false} dragControls={dragControls}>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
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

          <button
            type="button"
            onClick={onEdit}
            className="flex-1 min-w-0 text-start"
            aria-label={isAr ? "تعديل الوحدة" : "Edit module"}
          >
            <div className="font-medium truncate hover:underline">
              {isAr ? module.titleAr || module.titleEn : module.titleEn || module.titleAr}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <BookOpen className="h-3 w-3" />
              {lessonsCount} {isAr ? "درس" : lessonsCount === 1 ? "lesson" : "lessons"}
            </div>
          </button>

          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link href={`/${lang}/instructor/courses/${courseId}/lessons#module-${module.id}`}>
              <ListVideo className="h-4 w-4 mr-1.5" />
              {isAr ? "عرض دروس الوحدة" : "View Module Lessons"}
            </Link>
          </Button>

          <Button variant="ghost" size="icon" onClick={onEdit} aria-label={isAr ? "تعديل" : "Edit"}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label={isAr ? "حذف" : "Delete"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </Reorder.Item>
  )
}
