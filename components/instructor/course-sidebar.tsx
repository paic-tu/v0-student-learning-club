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
  
  // State for module dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [moduleTitleEn, setModuleTitleEn] = useState("")
  const [moduleTitleAr, setModuleTitleAr] = useState("")

  // Group lessons by module
  const lessonsByModule = lessons.reduce((acc, lesson) => {
    const moduleId = lesson.module_id || "uncategorized"
    if (!acc[moduleId]) acc[moduleId] = []
    acc[moduleId].push(lesson)
    return acc
  }, {} as Record<string, any[]>)

  const uncategorizedLessons = lessonsByModule["uncategorized"] || []

  const handleCreateModule = async () => {
    if (!moduleTitleEn || !moduleTitleAr) return
    
    setIsLoading(true)
    const result = await createModule({
      courseId: course.id,
      titleEn: moduleTitleEn,
      titleAr: moduleTitleAr,
    })
    setIsLoading(false)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Module created successfully",
      })
      setIsCreateDialogOpen(false)
      setModuleTitleEn("")
      setModuleTitleAr("")
      router.refresh()
    }
  }

  const handleUpdateModule = async () => {
    if (!selectedModule || !moduleTitleEn || !moduleTitleAr) return
    
    setIsLoading(true)
    const result = await updateModule(selectedModule.id, {
      titleEn: moduleTitleEn,
      titleAr: moduleTitleAr,
    })
    setIsLoading(false)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Module updated successfully",
      })
      setIsEditDialogOpen(false)
      setSelectedModule(null)
      router.refresh()
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure? This will delete the module and all its lessons.")) return

    const result = await deleteModule(moduleId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Module deleted successfully",
      })
      router.refresh()
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete lesson")

      toast({
        title: "Success",
        description: "Lesson deleted successfully",
      })
      
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lesson",
        variant: "destructive",
      })
    }
  }

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
    <div className="flex flex-col h-full border-r bg-muted/10 w-80">
      <div className="p-4 border-b">
        <Link 
          href={`/${lang}/instructor/courses/${course.id}/edit`}
          className="font-semibold hover:underline block truncate"
        >
          {lang === "ar" ? course.title_ar : course.title_en}
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <Button 
            size="sm" 
            className="w-full" 
            onClick={() => {
              setModuleTitleEn("")
              setModuleTitleAr("")
              setIsCreateDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Accordion type="multiple" defaultValue={modules.map(m => m.id)} className="space-y-4">
          {modules.map((module) => (
            <AccordionItem key={module.id} value={module.id} className="border rounded-lg bg-background px-2">
              <div className="flex items-center justify-between py-2">
                <AccordionTrigger className="hover:no-underline py-0 flex-1">
                  <span className="font-medium text-sm text-left">
                    {lang === "ar" ? module.title_ar : module.title_en}
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
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Module
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteModule(module.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Module
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <AccordionContent className="pt-2 pb-4">
                <div className="space-y-1">
                  {(lessonsByModule[module.id] || []).map((lesson: any) => (
                    <div key={lesson.id} className="flex items-center group">
                      <Link
                        href={`/${lang}/instructor/courses/${course.id}/lessons/${lesson.id}/edit`}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md text-sm hover:bg-muted transition-colors flex-1 min-w-0",
                          isLessonActive(lesson.id) && "bg-muted font-medium"
                        )}
                      >
                        {getLessonIcon(lesson.type)}
                        <span className="truncate flex-1">
                          {lang === "ar" ? lesson.title_ar : lesson.title_en}
                        </span>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteLesson(lesson.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Lesson
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                  
                  <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground mt-2" asChild>
                    <Link href={`/${lang}/instructor/courses/${course.id}/lessons/new?moduleId=${module.id}`}>
                      <Plus className="h-3 w-3 mr-2" />
                      Add Lesson
                    </Link>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {uncategorizedLessons.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider px-2">Uncategorized Lessons</h3>
            <div className="space-y-1">
              {uncategorizedLessons.map((lesson: any) => (
                <div key={lesson.id} className="flex items-center group">
                  <Link
                    href={`/${lang}/instructor/courses/${course.id}/lessons/${lesson.id}/edit`}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md text-sm hover:bg-muted transition-colors flex-1 min-w-0",
                      isLessonActive(lesson.id) && "bg-muted font-medium"
                    )}
                  >
                    {getLessonIcon(lesson.type)}
                    <span className="truncate flex-1">
                      {lang === "ar" ? lesson.title_ar : lesson.title_en}
                    </span>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteLesson(lesson.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Lesson
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {modules.length === 0 && uncategorizedLessons.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No content yet. Start by adding a module.
          </div>
        )}
      </div>

      {/* Create Module Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Module</DialogTitle>
            <DialogDescription>Add a new section to organize your lessons.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>English Title</Label>
              <Input 
                value={moduleTitleEn} 
                onChange={(e) => setModuleTitleEn(e.target.value)} 
                placeholder="Introduction"
              />
            </div>
            <div className="space-y-2">
              <Label>Arabic Title</Label>
              <Input 
                value={moduleTitleAr} 
                onChange={(e) => setModuleTitleAr(e.target.value)} 
                placeholder="مقدمة"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateModule} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Module"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>English Title</Label>
              <Input 
                value={moduleTitleEn} 
                onChange={(e) => setModuleTitleEn(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Arabic Title</Label>
              <Input 
                value={moduleTitleAr} 
                onChange={(e) => setModuleTitleAr(e.target.value)} 
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateModule} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
