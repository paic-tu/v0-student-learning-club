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
import { Loader2, Upload } from "lucide-react"

const lessonSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  slug: z.string().min(1, "Slug is required"),
  contentType: z.enum(["video", "article", "quiz", "assignment"]),
  status: z.enum(["draft", "published"]),
  orderIndex: z.coerce.number().int().min(0),
  durationMinutes: z.coerce.number().int().min(0).optional().nullable(),
  videoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")).nullable(),
  contentMarkdown: z.string().optional().nullable(),
  freePreview: z.boolean().default(false),
  moduleId: z.string().uuid().optional().nullable(),
})

type LessonFormData = z.infer<typeof lessonSchema>

interface InstructorLessonFormProps {
  courseId: string
  initialData?: any
  lessonId?: string
  lang: string
  moduleId?: string
  modules?: any[]
}

export function InstructorLessonForm({ courseId, initialData, lessonId, lang, moduleId, modules = [] }: InstructorLessonFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      titleEn: initialData?.title_en || "",
      titleAr: initialData?.title_ar || "",
      slug: initialData?.slug || "",
      contentType: (initialData?.type as any) || "video",
      status: (initialData?.status as any) || "draft",
      orderIndex: initialData?.order_index || 0,
      durationMinutes: initialData?.duration_minutes || undefined,
      videoUrl: initialData?.video_url || "",
      thumbnailUrl: initialData?.thumbnail_url || "",
      contentMarkdown: initialData?.content_markdown || "",
      freePreview: initialData?.is_preview || false,
      moduleId: initialData?.module_id || moduleId || null,
    },
  })

  async function onSubmit(data: LessonFormData) {
    setIsLoading(true)
    try {
      const cleanData = {
        ...data,
        slug: data.slug?.trim() || generateSlug(data.titleEn || ""),
        courseId: courseId,
        moduleId: data.moduleId,
        durationMinutes: data.durationMinutes || null,
        videoUrl: data.videoUrl || null,
        contentMarkdown: data.contentMarkdown || null,
      }

      const url = lessonId 
        ? `/api/admin/lessons/${lessonId}`
        : `/api/admin/lessons`
      
      const method = lessonId ? "PATCH" : "POST"

      // For PATCH, we don't need courseId in body usually, but keeping it doesn't hurt unless API strict
      // The API uses params.id for PATCH

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details?.fieldErrors ? JSON.stringify(error.details.fieldErrors) : error.error || "Failed to save lesson")
      }

      toast({
        title: "Success",
        description: `Lesson ${lessonId ? "updated" : "created"} successfully`,
      })
      
      router.push(`/${lang}/instructor/courses/${courseId}/edit`)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save lesson",
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: "videoUrl" | "thumbnailUrl") => {
    const file = e.target.files?.[0]
    if (!file) return

    const isThumb = fieldName === "thumbnailUrl"
    if (isThumb) setUploadingThumb(true)
    else setUploading(true)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
         const errorText = await res.text()
         throw new Error(errorText || "Upload failed")
      }

      const data = await res.json()
      form.setValue(fieldName, data.url)
      toast({
        title: "Success",
        description: "File uploaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      })
      console.error(error)
    } finally {
      if (isThumb) setUploadingThumb(false)
      else setUploading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {modules.length > 0 && (
          <FormField
            control={form.control}
            name="moduleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Module</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a module" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {lang === "ar" ? module.title_ar : module.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Organize this lesson under a specific module.
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
                  <FormLabel>Title (English)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Introduction to Python"
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
                  <FormLabel>Title (Arabic)</FormLabel>
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
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="introduction-to-python" />
                  </FormControl>
                  <FormDescription>URL-friendly identifier</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
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
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
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
                  <FormLabel>Order Index</FormLabel>
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
                  <FormLabel>Duration (minutes)</FormLabel>
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
                  <FormLabel>Free Preview</FormLabel>
                  <FormDescription>Allow non-enrolled users to preview this lesson</FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div className="space-y-4 border rounded-md p-4">
            <h3 className="text-lg font-medium">Content</h3>
            <FormField
            control={form.control}
            name="videoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video URL or Upload</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input {...field} value={field.value || ""} placeholder="https://youtube.com/... or upload file" />
                      <div className="relative">
                        <Input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handleFileUpload(e, "videoUrl")}
                          accept="video/*"
                          disabled={uploading}
                        />
                        <Button type="button" variant="outline" size="icon" disabled={uploading}>
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="thumbnailUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thumbnail URL or Upload (Cover Pic)</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input {...field} value={field.value || ""} placeholder="https://... or upload image" />
                      <div className="relative">
                        <Input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handleFileUpload(e, "thumbnailUrl")}
                          accept="image/*"
                          disabled={uploadingThumb}
                        />
                        <Button type="button" variant="outline" size="icon" disabled={uploadingThumb}>
                          {uploadingThumb ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    {field.value && (
                      <div className="mt-2 aspect-video w-40 relative rounded-md overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={field.value} alt="Preview" className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contentMarkdown"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content (Markdown)</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value || ""} rows={10} placeholder="# Lesson Content..." />
                </FormControl>
                <FormDescription>Use Markdown for formatting</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {lessonId ? "Update Lesson" : "Create Lesson"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
