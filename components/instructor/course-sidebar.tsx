"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Plus, MoreVertical, Pencil, Trash2, GripVertical, FileText, Video, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createModule, updateModule, deleteModule } from "@/lib/actions/module"
import { cn } from "@/lib/utils"

interface CourseSidebarProps {
  course: any
  modules: any[]
  lessons: any[]
  lang: string
}

export function CourseSidebar({ course, modules, lessons, lang }: CourseSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  
  // State for creating/editing modules
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [moduleTitleEn, setModuleTitleEn] = useState("")
  const [moduleTitleAr, setModuleTitleAr] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModule, setSelectedModule] = useState<any>(null)
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null)

  useEffect(() => {
    // Check if we are on a specific lesson page
    const segments = pathname.split("/")
    const lessonIndex = segments.indexOf("lessons")
    if (lessonIndex !== -1 && segments.length > lessonIndex + 1) {
      setActiveLessonId(segments[lessonIndex + 1])
    }
  }, [pathname])

  const lessonsByModule = modules.reduce((acc: any, module: any) => {
    acc[module.id] = lessons.filter((lesson: any) => lesson.moduleId === module.id)
    return acc
  }, {})

  const uncategorizedLessons = lessons.filter((lesson: any) => !lesson.moduleId)

  const handleCreateModule = async () => {
    if (!moduleTitleEn || !moduleTitleAr) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "يرجى إدخال العنوان باللغتين الإنجليزية والعربية" : "Please enter both English and Arabic titles",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/courses/${course.id}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title_en: moduleTitleEn,
          title_ar: moduleTitleAr,
          order: modules.length,
        }),
      })

      if (!response.ok) throw new Error("Failed to create module")

      toast({
        title: isAr ? "تم بنجاح" : "Success",
        description: isAr ? "تم إنشاء الوحدة بنجاح" : "Module created successfully",
      })
      setIsCreateDialogOpen(false)
      setModuleTitleEn("")
      setModuleTitleAr("")
      router.refresh()
    } catch (error) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل إنشاء الوحدة" : "Failed to create module",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateModule = async () => {
    if (!selectedModule || !moduleTitleEn || !moduleTitleAr) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/courses/${course.id}/modules/${selectedModule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title_en: moduleTitleEn,
          title_ar: moduleTitleAr,
        }),
      })

      if (!response.ok) throw new Error("Failed to update module")

      toast({
        title: isAr ? "تم بنجاح" : "Success",
        description: isAr ? "تم تحديث الوحدة بنجاح" : "Module updated successfully",
      })
      setIsEditDialogOpen(false)
      setSelectedModule(null)
      router.refresh()
    } catch (error) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل تحديث الوحدة" : "Failed to update module",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteModule = async () => {
    if (!moduleToDelete) return

    try {
      const response = await fetch(`/api/courses/${course.id}/modules/${moduleToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete module")

      toast({
        title: isAr ? "تم بنجاح" : "Success",
        description: isAr ? "تم حذف الوحدة بنجاح" : "Module deleted successfully",
      })
      setModuleToDelete(null)
      router.refresh()
    } catch (error) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل حذف الوحدة" : "Failed to delete module",
        variant: "destructive",
      })
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذا الدرس؟" : "Are you sure you want to delete this lesson?")) return

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete lesson")

      toast({
        title: isAr ? "تم بنجاح" : "Success",
        description: isAr ? "تم حذف الدرس بنجاح" : "Lesson deleted successfully",
      })
      
      router.refresh()
    } catch (error) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل حذف الدرس" : "Failed to delete lesson",
        variant: "destructive",
      })
    }
  }

  const isAr = lang === "ar"

  const openEditDialog = (module: any) => {
    setSelectedModule(module)
    setModuleTitleEn(module.title_en)
    setModuleTitleAr(module.title_ar)
    setIsEditDialogOpen(true)
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="h-4 w-4" />
      case "article": return <FileText className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const isLessonActive = (lessonId: string) => {
    return pathname.includes(`/lessons/${lessonId}`)
  }

  return (
    <div className="flex flex-col h-full bg-background border-r">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">{isAr ? course.title_ar || course.title_en : course.title_en}</h2>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">{isAr ? "مدرب" : "Instructor"}</Badge>
          <Badge variant={course.isPublished ? "default" : "secondary"}>
            {course.isPublished ? (isAr ? "منشور" : "Published") : (isAr ? "مسودة" : "Draft")}
          </Badge>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{isAr ? "وحدات الدورة" : "Course Modules"}</h3>
          <Button size="sm" variant="ghost" onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {isAr ? "إضافة وحدة" : "Add Module"}
          </Button>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {modules.map((module: any) => (
            <AccordionItem key={module.id} value={module.id} className="border rounded-lg px-2">
              <div className="flex items-center justify-between py-2">
                <AccordionTrigger className="hover:no-underline py-0 flex-1">
                  <span className="font-medium text-sm text-left">
                    {isAr ? module.title_ar || module.title_en : module.title_en}
                  </span>
                </AccordionTrigger>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(module)}>
                      <Edit className="h-4 w-4 mr-2" />
                      {isAr ? "تعديل" : "Edit"}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => setModuleToDelete(module.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isAr ? "حذف" : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <AccordionContent className="pt-2 pb-4">
                <div className="space-y-1 pl-4 border-l-2 border-muted ml-2">
                  {lessonsByModule[module.id]?.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 italic">{isAr ? "لا توجد دروس في هذه الوحدة" : "No lessons in this module"}</p>
                  ) : (
                    lessonsByModule[module.id]?.map((lesson: any) => (
                      <Link 
                        key={lesson.id} 
                        href={`/${lang}/instructor/courses/${course.id}/lessons/${lesson.id}/edit`}
                        className={cn(
                          "flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted transition-colors",
                          activeLessonId === lesson.id ? "bg-muted font-medium" : "text-muted-foreground"
                        )}
                      >
                        {getLessonIcon(lesson.type)}
                        <span className="truncate">{isAr ? lesson.title_ar || lesson.title_en : lesson.title_en}</span>
                        {lesson.isFreePreview && (
                          <Badge variant="outline" className="ml-auto text-[10px] h-5 px-1">{isAr ? "مجاني" : "Free"}</Badge>
                        )}
                      </Link>
                    ))
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start mt-2 text-xs text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <Link href={`/${lang}/instructor/courses/${course.id}/lessons/new?moduleId=${module.id}`}>
                      <PlusCircle className="h-3 w-3 mr-2" />
                      {isAr ? "إضافة درس" : "Add Lesson"}
                    </Link>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {uncategorizedLessons.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{isAr ? "دروس غير مصنفة" : "Uncategorized Lessons"}</h3>
            <div className="space-y-1 border rounded-lg p-2">
              {uncategorizedLessons.map((lesson: any) => (
                <Link 
                  key={lesson.id} 
                  href={`/${lang}/instructor/courses/${course.id}/lessons/${lesson.id}/edit`}
                  className={cn(
                    "flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted transition-colors",
                    activeLessonId === lesson.id ? "bg-muted font-medium" : "text-muted-foreground"
                  )}
                >
                  {getLessonIcon(lesson.type)}
                  <span className="truncate">{isAr ? lesson.title_ar || lesson.title_en : lesson.title_en}</span>
                  {lesson.isFreePreview && (
                    <Badge variant="outline" className="ml-auto text-[10px] h-5 px-1">{isAr ? "مجاني" : "Free"}</Badge>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-4 mt-auto">
          <Button className="w-full" asChild>
            <Link href={`/${lang}/instructor/courses/${course.id}/lessons/new`}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {isAr ? "إنشاء درس جديد" : "Create New Lesson"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Create Module Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "إنشاء وحدة" : "Create Module"}</DialogTitle>
            <DialogDescription>{isAr ? "أضف قسماً جديداً لتنظيم دروسك." : "Add a new section to organize your lessons."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isAr ? "العنوان بالإنجليزية" : "English Title"}</Label>
              <Input 
                value={moduleTitleEn}
                onChange={(e) => setModuleTitleEn(e.target.value)}
                placeholder={isAr ? "عنوان الوحدة بالإنجليزية" : "Module title in English"}
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "العنوان بالعربية" : "Arabic Title"}</Label>
              <Input 
                value={moduleTitleAr}
                onChange={(e) => setModuleTitleAr(e.target.value)}
                placeholder={isAr ? "عنوان الوحدة بالعربية" : "Module title in Arabic"}
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleCreateModule} disabled={isLoading}>
              {isLoading ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "تعديل الوحدة" : "Edit Module"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isAr ? "العنوان بالإنجليزية" : "English Title"}</Label>
              <Input 
                value={moduleTitleEn}
                onChange={(e) => setModuleTitleEn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "العنوان بالعربية" : "Arabic Title"}</Label>
              <Input 
                value={moduleTitleAr}
                onChange={(e) => setModuleTitleAr(e.target.value)}
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleUpdateModule} disabled={isLoading}>
              {isLoading ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}
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
              {isAr ? "سيؤدي هذا الإجراء إلى حذف الوحدة وجميع الدروس بداخلها. لا يمكن التراجع عن هذا الإجراء." : "This action cannot be undone. This will permanently delete the module and all lessons within it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModule} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
