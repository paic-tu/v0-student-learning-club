"use client"

import type React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, DollarSign, Cog, ImageIcon, List, Plus } from "lucide-react"
import { z } from "zod"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { CourseFormProps } from "@/types/course-form-props"
import { StringListInput } from "@/components/ui/string-list-input"

import { MediaUploadField } from "@/components/admin/media-upload-field"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import ReactMarkdown from "react-markdown"

const getCourseSchema = (isAr: boolean) => z.object({
  titleEn: z.string().min(1, isAr ? "العنوان بالإنجليزية مطلوب" : "English title is required"),
  titleAr: z.string().min(1, isAr ? "العنوان بالعربية مطلوب" : "Arabic title is required"),
  subtitleEn: z.string().optional().or(z.literal("")),
  subtitleAr: z.string().optional().or(z.literal("")),
  descriptionEn: z.string().min(10, isAr ? "الوصف بالإنجليزية يجب أن يكون 10 أحرف على الأقل" : "English description must be at least 10 characters"),
  descriptionAr: z.string().min(10, isAr ? "الوصف بالعربية يجب أن يكون 10 أحرف على الأقل" : "Arabic description must be at least 10 characters"),
  language: z.string().default("ar"),
  requirements: z.array(z.string()).default([]),
  learningOutcomes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  instructorId: z.string().min(1, isAr ? "المدرب مطلوب" : "Instructor is required"),
  categoryId: z.string().optional().nullable(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  duration: z.number().int().min(0),
  price: z.number().min(0),
  streamProductId: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.string().uuid().safeParse(v).success, {
      message: isAr ? "Stream product_id غير صحيح" : "Invalid Stream product_id",
    }),
  isFree: z.boolean().default(false),
  isLive: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  thumbnailUrl: z.string().optional().or(z.literal("")),
  videoUrl: z.string().optional().or(z.literal("")),
})

export function CourseForm({ categories: initialCategories, instructors, redirectBase, lang = "en" }: CourseFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>(initialCategories)
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null)
  
  const isAr = lang === "ar"
  const courseSchema = getCourseSchema(isAr)

  // New Category State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [newCategoryNameEn, setNewCategoryNameEn] = useState("")
  const [newCategoryNameAr, setNewCategoryNameAr] = useState("")
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)


  const handleCreateCategory = async () => {
    if (!newCategoryNameEn || !newCategoryNameAr) {
      toast({
        title: isAr ? "خطأ في التحقق" : "Validation Error",
        description: isAr ? "الأسماء بالإنجليزية والعربية مطلوبة" : "Both English and Arabic names are required",
        variant: "destructive",
      })
      return
    }

    setIsCreatingCategory(true)
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEn: newCategoryNameEn,
          nameAr: newCategoryNameAr,
        }),
      })

      if (!res.ok) throw new Error("Failed to create category")

      const newCategory = await res.json()
      setCategories([...categories, newCategory])
      form.setValue("categoryId", newCategory.id.toString())
      setIsCategoryDialogOpen(false)
      setNewCategoryNameEn("")
      setNewCategoryNameAr("")
      toast({ 
        title: isAr ? "تم بنجاح" : "Success", 
        description: isAr ? "تم إنشاء التصنيف بنجاح" : "Category created successfully" 
      })
    } catch (error) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل إنشاء التصنيف" : "Failed to create category",
        variant: "destructive",
      })
    } finally {
      setIsCreatingCategory(false)
    }
  }

  const defaultValues = useMemo<z.infer<ReturnType<typeof getCourseSchema>>>(
    () => ({
      titleEn: "",
      titleAr: "",
      subtitleEn: "",
      subtitleAr: "",
      descriptionEn: "",
      descriptionAr: "",
      language: "ar",
      requirements: [],
      learningOutcomes: [],
      tags: [],
      instructorId: instructors.length === 1 ? String(instructors[0]?.id) : "",
      categoryId: null,
      difficulty: "beginner",
      duration: 0,
      price: 0,
      streamProductId: null,
      isFree: true,
      isLive: false,
      isPublished: false,
      thumbnailUrl: "",
      videoUrl: "",
    }),
    [instructors],
  )

  const form = useForm<z.infer<ReturnType<typeof getCourseSchema>>>({
    resolver: zodResolver(courseSchema),
    defaultValues,
  })

  const onSubmit = async (data: z.infer<ReturnType<typeof getCourseSchema>>) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create course")
      }

      const result = await response.json()

      toast({
        title: isAr ? "تم بنجاح" : "Success",
        description: isAr ? "تم إنشاء الدورة بنجاح" : "Course created successfully",
      })

      // Redirect to the course edit page with the new ID
      if (redirectBase) {
        // If redirectBase contains :id, replace it
        if (redirectBase.includes(":id")) {
          router.push(redirectBase.replace(":id", result.id))
        } else {
          router.push(`${redirectBase}/${result.id}`)
        }
      } else {
        router.push(`/admin/courses/${result.id}`)
      }
    } catch (error) {
      console.error("[v0] Error creating course:", error)
      toast({
        title: isAr ? "خطأ" : "Error",
        description: error instanceof Error ? error.message : (isAr ? "فشل إنشاء الدورة" : "Failed to create course"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const FormLayout = ({
    title,
    description,
    children,
  }: { title: string; description: string; children: React.ReactNode }) => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {children}
    </div>
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">
              <FileText className="w-4 h-4 mr-2" />
              {isAr ? "الأساسية" : "Basic"}
            </TabsTrigger>
            <TabsTrigger value="description">
              <FileText className="w-4 h-4 mr-2" />
              {isAr ? "الوصف" : "Description"}
            </TabsTrigger>
            <TabsTrigger value="details">
              <List className="w-4 h-4 mr-2" />
              {isAr ? "التفاصيل" : "Details"}
            </TabsTrigger>
            <TabsTrigger value="media">
              <ImageIcon className="w-4 h-4 mr-2" />
              {isAr ? "الوسائط" : "Media"}
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Cog className="w-4 h-4 mr-2" />
              {isAr ? "متقدم" : "Advanced"}
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6 mt-6">
            <FormLayout 
              title={isAr ? "المعلومات الأساسية" : "Basic Information"} 
              description={isAr ? "أدخل تفاصيل الدورة الأساسية" : "Enter the basic course details"}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="titleEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "العنوان بالإنجليزية *" : "Title (English) *"}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder={isAr ? "مثال: بايثون للمبتدئين" : "e.g., Python for Beginners"} 
                          dir="ltr" 
                          lang="en" 
                          autoComplete="off" 
                          autoCorrect="off" 
                          autoCapitalize="none" 
                          spellCheck={false}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">{isAr ? "عنوان الدورة المعروض للطلاب" : "The course title displayed to students"}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="titleAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "العنوان بالعربية *" : "Title (Arabic) *"}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="بايثون للمبتدئين" dir="rtl" />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">{isAr ? "العنوان المعروض للطلاب" : "The course title displayed to students"}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitleEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "العنوان الفرعي بالإنجليزية" : "Subtitle (English)"}</FormLabel>
                      <FormControl>
                        <Input placeholder={isAr ? "عنوان فرعي قصير بالإنجليزية" : "Short subtitle in English"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitleAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "العنوان الفرعي بالعربية" : "Subtitle (Arabic)"}</FormLabel>
                      <FormControl>
                        <Input placeholder="عنوان فرعي قصير بالعربية" {...field} dir="rtl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "المدرب *" : "Instructor *"}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isAr ? "اختر مدرب الدورة" : "Select the course instructor"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {instructors.map((instructor) => (
                            <SelectItem key={instructor.id} value={instructor.id.toString()}>
                              {instructor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{isAr ? "من سيقوم بتدريس هذه الدورة" : "Who will teach this course"}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "التصنيف (اختياري)" : "Category (Optional)"}</FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => field.onChange(value === "null" ? null : value)}
                          value={field.value || "null"}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={isAr ? "اختر تصنيفاً" : "Select a category"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">{isAr ? "لا يوجد" : "None"}</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {isAr 
                                  ? category.name_ar || category.nameAr || category.name_en || category.nameEn || `تصنيف ${category.id}`
                                  : category.name_en || category.nameEn || category.name_ar || category.nameAr || `Category ${category.id}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" type="button" title={isAr ? "إضافة تصنيف جديد" : "Add new category"}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{isAr ? "إنشاء تصنيف جديد" : "Create New Category"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{isAr ? "الاسم بالإنجليزية" : "English Name"}</label>
                                <Input 
                                  value={newCategoryNameEn} 
                                  onChange={(e) => setNewCategoryNameEn(e.target.value)}
                                  placeholder="e.g. Web Development"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{isAr ? "الاسم بالعربية" : "Arabic Name"}</label>
                                <Input 
                                  value={newCategoryNameAr} 
                                  onChange={(e) => setNewCategoryNameAr(e.target.value)}
                                  placeholder="مثال: تطوير الويب"
                                  dir="rtl"
                                />
                              </div>
                              <Button onClick={handleCreateCategory} disabled={isCreatingCategory} className="w-full" type="button">
                                {isCreatingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isAr ? "إنشاء" : "Create"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "مستوى الصعوبة *" : "Difficulty Level *"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">{isAr ? "مبتدئ" : "Beginner"}</SelectItem>
                          <SelectItem value="intermediate">{isAr ? "متوسط" : "Intermediate"}</SelectItem>
                          <SelectItem value="advanced">{isAr ? "متقدم" : "Advanced"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{isAr ? "مستوى الجمهور المستهدف" : "Target audience level"}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "المدة (بالدقائق) *" : "Duration (minutes) *"}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="600"
                          onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">{isAr ? "إجمالي مدة الدورة" : "Total course duration"}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormLayout>
          </TabsContent>

          {/* Description Tab */}
          <TabsContent value="description" className="space-y-6 mt-6">
            <FormLayout 
              title={isAr ? "وصف الدورة" : "Course Description"} 
              description={isAr ? "قدم وصفاً مفصلاً للدورة باللغتين" : "Provide detailed course information in both languages"}
            >
              <FormField
                control={form.control}
                name="descriptionEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isAr ? "الوصف بالإنجليزية *" : "Description (English) *"}</FormLabel>
                    <FormControl>
                      <Tabs defaultValue="edit" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="edit">{isAr ? "تحرير" : "Edit"}</TabsTrigger>
                          <TabsTrigger value="preview">{isAr ? "معاينة" : "Preview"}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit" className="mt-2">
                          <Textarea
                            {...field}
                            rows={8}
                            placeholder={isAr ? "قدم وصفاً شاملاً للدورة..." : "Provide a comprehensive description of your course..."}
                            dir="ltr"
                            lang="en"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            className="font-mono text-sm"
                          />
                        </TabsContent>
                        <TabsContent value="preview" className="mt-2">
                          <div className="prose dark:prose-invert max-w-none rounded-md border p-4" dir="ltr" lang="en">
                            <ReactMarkdown>{String(field.value || "")}</ReactMarkdown>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{field.value?.length || 0} {isAr ? "حرف" : "characters"}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descriptionAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isAr ? "الوصف بالعربية *" : "Description (Arabic) *"}</FormLabel>
                    <FormControl>
                      <Tabs defaultValue="edit" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="edit">{isAr ? "تحرير" : "Edit"}</TabsTrigger>
                          <TabsTrigger value="preview">{isAr ? "معاينة" : "Preview"}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit" className="mt-2">
                          <Textarea
                            {...field}
                            rows={8}
                            placeholder="قدم وصفاً شاملاً لدورتك..."
                            dir="rtl"
                            className="font-mono text-sm"
                          />
                        </TabsContent>
                        <TabsContent value="preview" className="mt-2">
                          <div className="prose dark:prose-invert max-w-none rounded-md border p-4" dir="rtl" lang="ar">
                            <ReactMarkdown>{String(field.value || "")}</ReactMarkdown>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{field.value?.length || 0} {isAr ? "حرف" : "أحرف"}</p>
                    <FormMessage />
                  </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "لغة الدورة" : "Course Language"}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isAr ? "اختر اللغة" : "Select language"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ar">{isAr ? "العربية" : "Arabic"}</SelectItem>
                      <SelectItem value="en">{isAr ? "الإنجليزية" : "English"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormLayout>
        </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6 mt-6">
            <FormLayout 
              title={isAr ? "تفاصيل الدورة" : "Course Details"} 
              description={isAr ? "إدارة المتطلبات ومخرجات التعلم والوسوم" : "Manage requirements, learning outcomes, and tags"}
            >
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "المتطلبات" : "Requirements"}</FormLabel>
                      <FormControl>
                        <StringListInput 
                          value={field.value} 
                          onChange={field.onChange} 
                          placeholder={isAr ? "أضف متطلباً..." : "Add a requirement..."}
                        />
                      </FormControl>
                      <FormDescription>
                        {isAr ? "ما يجب أن يعرفه الطلاب قبل الالتحاق بالدورة" : "What students should know before taking this course."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="learningOutcomes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "مخرجات التعلم" : "Learning Outcomes"}</FormLabel>
                      <FormControl>
                        <StringListInput 
                          value={field.value} 
                          onChange={field.onChange} 
                          placeholder={isAr ? "أضف مخرج تعلم..." : "Add a learning outcome..."}
                        />
                      </FormControl>
                      <FormDescription>
                        {isAr ? "ما سيتعلمه الطلاب من هذه الدورة" : "What students will learn from this course."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "الوسوم" : "Tags"}</FormLabel>
                      <FormControl>
                        <StringListInput 
                          value={field.value} 
                          onChange={field.onChange} 
                          placeholder={isAr ? "أضف وسماً..." : "Add a tag..."}
                        />
                      </FormControl>
                      <FormDescription>
                        {isAr ? "الكلمات المفتاحية لمساعدة الطلاب في العثور على دورتك" : "Keywords to help students find your course."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormLayout>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6 mt-6">
            <FormLayout 
              title={isAr ? "الوسائط والصور المصغرة" : "Media & Thumbnails"} 
              description={isAr ? "أضف روابط الصورة المصغرة والفيديو للدورة" : "Add course thumbnail and video URLs"}
            >
              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MediaUploadField
                        name="thumbnailUrl"
                        label={isAr ? "رابط الصورة المصغرة" : "Thumbnail URL"}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="https://example.com/thumbnail.jpg"
                        isAr={isAr}
                        type="image"
                      />
                    </FormControl>
                    <FormDescription>
                      {isAr ? "رابط الصورة المصغرة للدورة" : "Course thumbnail image URL"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MediaUploadField
                        name="videoUrl"
                        label={isAr ? "رابط الفيديو" : "Video URL"}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="https://youtube.com/watch?v=..."
                        isAr={isAr}
                        type="video"
                      />
                    </FormControl>
                    <FormDescription>
                      {isAr ? "رابط فيديو مقدمة الدورة" : "Course introduction or trailer video URL"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormLayout>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6 mt-6">
            <FormLayout 
              title={isAr ? "التسعير والنشر" : "Pricing & Publishing"} 
              description={isAr ? "تكوين تسعير الدورة وتوافرها" : "Configure course pricing and availability"}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "السعر (ر.س)" : "Price (SAR)"}</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground">{isAr ? "اتركه 0 للدورات المجانية" : "Leave at 0 for free courses"}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="streamProductId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "Stream product_id" : "Stream product_id"}</FormLabel>
                      <FormControl>
                        <Input
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          dir="ltr"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {isAr ? "مطلوب للدورات المدفوعة عند استخدام Stream items" : "Required for paid courses when using Stream items"}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFree"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-8">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                      <FormLabel>{isAr ? "دورة مجانية" : "Free Course"}</FormLabel>
                      <p className="text-xs text-muted-foreground">{isAr ? "جعل هذه الدورة مجانية" : "Mark this course as free"}</p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isLive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{isAr ? "بث مباشر (Live)" : "Live Stream"}</FormLabel>
                    <p className="text-xs text-muted-foreground">{isAr ? "تفعيل ميزة البث المباشر لهذه الدورة" : "Enable live streaming for this course"}</p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{isAr ? "نشر الدورة" : "Publish Course"}</FormLabel>
                      <p className="text-xs text-muted-foreground">{isAr ? "جعل هذه الدورة مرئية للطلاب" : "Make this course visible to students"}</p>
                    </div>
                  </FormItem>
                )}
              />
            </FormLayout>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t">
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAr ? "إنشاء الدورة" : "Create Course"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading} size="lg">
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
