"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { MediaUploadField } from "@/components/admin/media-upload-field"
import { Loader2 } from "lucide-react"

const getLessonSchema = (isAr: boolean) => z.object({
  titleEn: z.string().min(1, isAr ? "العنوان بالإنجليزية مطلوب" : "English title is required"),
  titleAr: z.string().min(1, isAr ? "العنوان بالعربية مطلوب" : "Arabic title is required"),
  slug: z.string().min(1, isAr ? "الرابط المختصر مطلوب" : "Slug is required"),
  contentType: z.enum(["video", "article", "quiz", "assignment"]),
  status: z.enum(["draft", "published"]),
  orderIndex: z.coerce.number().int().min(0),
  durationMinutes: z.coerce.number().int().min(0).optional().nullable(),
  videoUrl: z.string().optional().or(z.literal("")).nullable(),
  thumbnailUrl: z.string().optional().or(z.literal("")).nullable(),
  contentMarkdown: z.string().optional().nullable(),
  freePreview: z.boolean().default(false),
  moduleId: z.string().uuid().optional().nullable(),
  quizId: z.string().optional().nullable(),
  assignmentAllowedMimeTypes: z.string().optional().nullable(),
  assignmentMaxFileSizeMb: z.coerce.number().int().min(1).max(500).optional().nullable(),
  assignmentDueAt: z.string().optional().nullable(),
})

type LessonFormData = z.infer<ReturnType<typeof getLessonSchema>>

interface InstructorLessonFormProps {
  courseId: string
  initialData?: any
  lessonId?: string
  lang: string
  moduleId?: string
  modules?: any[]
  quizzes?: any[]
}

export function InstructorLessonForm({ courseId, initialData, lessonId, lang, moduleId, modules = [], quizzes = [] }: InstructorLessonFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const isAr = lang === "ar"
  const lessonSchema = getLessonSchema(isAr)
  const assignmentCfg = (initialData?.assignmentConfig || initialData?.assignment_config || {}) as any

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      titleEn: initialData?.titleEn || initialData?.title_en || "",
      titleAr: initialData?.titleAr || initialData?.title_ar || "",
      slug: initialData?.slug || "",
      contentType: (initialData?.type as any) || "video",
      status: (initialData?.status as any) || "draft",
      orderIndex: initialData?.orderIndex || initialData?.order_index || 0,
      durationMinutes: initialData?.durationMinutes || initialData?.duration_minutes || undefined,
      videoUrl: initialData?.videoUrl || initialData?.video_url || "",
      thumbnailUrl: initialData?.thumbnailUrl || initialData?.thumbnail_url || "",
      contentMarkdown: initialData?.contentMarkdown || initialData?.content_markdown || initialData?.contentEn || initialData?.content_en || "",
      freePreview: initialData?.isPreview || initialData?.is_preview || false,
      moduleId: initialData?.moduleId || initialData?.module_id || moduleId || null,
      quizId: initialData?.quizConfig?.quizId || initialData?.quiz_config?.quizId || null,
      assignmentAllowedMimeTypes: Array.isArray(assignmentCfg?.allowedMimeTypes) ? assignmentCfg.allowedMimeTypes.join(", ") : "",
      assignmentMaxFileSizeMb: assignmentCfg?.maxFileSizeBytes ? Math.round(Number(assignmentCfg.maxFileSizeBytes) / 1024 / 1024) : 500,
      assignmentDueAt: assignmentCfg?.dueAt ? String(assignmentCfg.dueAt).slice(0, 16) : "",
    },
  })

  async function onSubmit(data: z.infer<ReturnType<typeof getLessonSchema>>) {
    setIsLoading(true)

    try {
      const url = lessonId 
        ? `/api/courses/${courseId}/lessons/${lessonId}`
        : `/api/courses/${courseId}/lessons`
      
      const method = lessonId ? "PATCH" : "POST"

      const submitData: any = {
        ...data,
        quizConfig: data.contentType === "quiz" && data.quizId ? { quizId: data.quizId } : null,
      }

      if (data.contentType === "assignment") {
        const allowedMimeTypes = String(data.assignmentAllowedMimeTypes || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        const maxMb = Number(data.assignmentMaxFileSizeMb || 500)
        submitData.assignmentConfig = {
          allowedMimeTypes,
          maxFileSizeBytes: Math.min(500, Math.max(1, Math.round(maxMb))) * 1024 * 1024,
          dueAt: data.assignmentDueAt ? new Date(data.assignmentDueAt).toISOString() : null,
        }
      } else {
        submitData.assignmentConfig = null
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Lesson save error:", errorData);
        throw new Error(errorData.error || "Something went wrong")
      }

      toast({
        title: isAr ? "تم بنجاح" : "Success",
        description: isAr ? "تم حفظ الدرس بنجاح" : "Lesson saved successfully",
      })

      router.push(`/${lang}/instructor/courses/${courseId}/edit`)
      router.refresh()
    } catch (error: any) {
      console.error("Lesson form submit error:", error);
      toast({
        title: isAr ? "خطأ" : "Error",
        description: error.message || (isAr ? "حدث خطأ ما. يرجى المحاولة مرة أخرى." : "Something went wrong. Please try again."),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const contentType = form.watch("contentType")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {modules.length > 0 && (
          <FormField
            control={form.control}
            name="moduleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isAr ? "الوحدة" : "Module"}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isAr ? "اختر وحدة" : "Select a module"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {lang === "ar" ? (module.titleAr || module.title_ar) : (module.titleEn || module.title_en)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {isAr ? "نظم هذا الدرس تحت وحدة معينة." : "Organize this lesson under a specific module."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="titleEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "العنوان (إنجليزي)" : "Title (English)"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={isAr ? "مقدمة في بايثون" : "Introduction to Python"}
                      dir="ltr"
                      lang="en"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      onBlur={(e) => {
                        field.onBlur()
                        if (!form.getValues("slug")) {
                          form.setValue("slug", generateSlug(e.target.value))
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titleAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مقدمة في بايثون" dir="rtl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "الرابط المختصر (Slug)" : "Slug"}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={isAr ? "introduction-to-python" : "introduction-to-python"} />
                  </FormControl>
                  <FormDescription>{isAr ? "معرف مناسب للرابط" : "URL-friendly identifier"}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "نوع المحتوى" : "Content Type"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="video">{isAr ? "فيديو" : "Video"}</SelectItem>
                      <SelectItem value="article">{isAr ? "مقال" : "Article"}</SelectItem>
                      <SelectItem value="quiz">{isAr ? "اختبار" : "Quiz"}</SelectItem>
                      <SelectItem value="assignment">{isAr ? "واجب" : "Assignment"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "الحالة" : "Status"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">{isAr ? "مسودة" : "Draft"}</SelectItem>
                      <SelectItem value="published">{isAr ? "منشور" : "Published"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orderIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "ترتيب العرض" : "Order Index"}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "المدة (بالدقائق)" : "Duration (minutes)"}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                      placeholder="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <FormField
            control={form.control}
            name="freePreview"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{isAr ? "معاينة مجانية" : "Free Preview"}</FormLabel>
                  <FormDescription>{isAr ? "السماح لغير المشتركين بمعاينة هذا الدرس" : "Allow non-enrolled users to preview this lesson"}</FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div className="space-y-4 border rounded-md p-4">
            <h3 className="text-lg font-medium">{isAr ? "المحتوى" : "Content"}</h3>

            {(contentType === "video") && (
              <>
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "رابط الفيديو أو رفع ملف" : "Video URL or Upload"}</FormLabel>
                      <FormControl>
                        <MediaUploadField
                          name="videoUrl"
                          value={field.value || ""}
                          onChange={field.onChange}
                          type="video"
                          placeholder={isAr ? "https://youtube.com/... أو رفع فيديو" : "https://youtube.com/... or upload video"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "المدة (بالدقائق)" : "Duration (minutes)"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {(contentType === "video" || contentType === "article") && (
              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isAr ? "رابط الصورة المصغرة أو رفع صورة" : "Thumbnail URL or Upload (Cover Pic)"}</FormLabel>
                    <FormControl>
                      <MediaUploadField
                        name="thumbnailUrl"
                        value={field.value || ""}
                        onChange={field.onChange}
                        type="image"
                        placeholder={isAr ? "https://... أو رفع صورة" : "https://... or upload image"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(contentType === "article" || contentType === "video" || contentType === "assignment") && (
              <FormField
                control={form.control}
                name="contentMarkdown"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isAr
                        ? contentType === "article"
                          ? "محتوى المقال (Markdown)"
                          : contentType === "assignment"
                            ? "تعليمات الواجب (Markdown)"
                            : "وصف الفيديو / الملاحظات"
                        : contentType === "article"
                          ? "Article Content (Markdown)"
                          : contentType === "assignment"
                            ? "Assignment Instructions (Markdown)"
                            : "Video Description / Notes"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        rows={10}
                        placeholder={
                          isAr
                            ? contentType === "article"
                              ? "# اكتب مقالك هنا..."
                              : contentType === "assignment"
                                ? "اكتب تعليمات الواجب هنا..."
                                : "أضف ملاحظات أو وصف للفيديو..."
                            : contentType === "article"
                              ? "# Write your article here..."
                              : contentType === "assignment"
                                ? "Write assignment instructions here..."
                                : "Add notes or description..."
                        }
                      />
                    </FormControl>
                    <FormDescription>{isAr ? "استخدم Markdown للتنسيق" : "Use Markdown for formatting"}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {contentType === "quiz" && (
              <FormField
                control={form.control}
                name="quizId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isAr ? "اختر الكويز" : "Select Quiz"}</FormLabel>
                    {quizzes && quizzes.length > 0 ? (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isAr ? "اختر الكويز" : "Select a quiz"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {quizzes.map((quiz) => (
                            <SelectItem key={quiz.id} value={quiz.id}>
                              {isAr ? quiz.titleAr : quiz.titleEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-4 border rounded-md bg-muted text-center text-muted-foreground">
                        {isAr ? "لا توجد اختبارات متاحة. يرجى إنشاء اختبار من قسم الاختبارات أولاً." : "No quizzes available. Please create a quiz from the Quizzes section first."}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {contentType === "assignment" && (
              <div className="space-y-4 border rounded-md p-4">
                <h3 className="text-lg font-medium">{isAr ? "إعدادات الواجب" : "Assignment Settings"}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="assignmentMaxFileSizeMb"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isAr ? "حد حجم الملف (MB)" : "Max file size (MB)"}</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={500} {...field} value={field.value ?? 500} />
                        </FormControl>
                        <FormDescription>{isAr ? "الحد الأقصى 500MB لكل طالب" : "Up to 500MB per student"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignmentDueAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isAr ? "موعد التسليم (اختياري)" : "Due date (optional)"}</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="assignmentAllowedMimeTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "أنواع الملفات المسموحة (اختياري)" : "Allowed file types (optional)"}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder={isAr ? "مثال: application/pdf, image/png" : "e.g. application/pdf, image/png"}
                        />
                      </FormControl>
                      <FormDescription>{isAr ? "اتركها فارغة للسماح بأي نوع" : "Leave empty to allow any type"}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {lessonId ? (isAr ? "تحديث الدرس" : "Update Lesson") : (isAr ? "إنشاء الدرس" : "Create Lesson")}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
