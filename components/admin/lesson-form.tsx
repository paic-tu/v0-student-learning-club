"use client"

import { useEffect, useState } from "react"
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
import { FormLayout } from "@/components/admin/form-layout"
import { toast } from "sonner"
import { MediaUploadField } from "@/components/admin/media-upload-field"

const lessonSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  slug: z.string().min(1, "Slug is required"),
  courseId: z.string().min(1, "Course is required"),
  moduleId: z.string().uuid().optional().nullable(),
  trackId: z.string().optional().nullable(),
  contentType: z.enum(["video", "article", "quiz", "assignment"]),
  status: z.enum(["draft", "published"]),
  orderIndex: z.number().int().min(0),
  durationMinutes: z.number().int().min(0).optional().nullable(),
  videoUrl: z.string().optional().or(z.literal("")).nullable(),
  thumbnailUrl: z.string().optional().or(z.literal("")).nullable(),
  contentMarkdown: z.string().optional().nullable(),
  freePreview: z.boolean().default(false),
  prerequisites: z.array(z.string()).default([]),
})

type LessonFormData = z.infer<typeof lessonSchema>

interface LessonFormProps {
  courses: Array<{ id: string; titleEn: string }>
  initialData?: any
}

export function LessonForm({ courses, initialData }: LessonFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [modules, setModules] = useState<any[]>([])

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      titleEn: initialData?.title_en || "",
      titleAr: initialData?.title_ar || "",
      slug: initialData?.slug || "",
      courseId: initialData?.course_id || undefined,
      moduleId: initialData?.module_id || null,
      contentType: (initialData?.content_type as any) || "video",
      status: (initialData?.status as any) || "draft",
      orderIndex: initialData?.order_index || 0,
      durationMinutes: initialData?.duration_minutes || undefined,
      videoUrl: initialData?.video_url || "",
      thumbnailUrl: initialData?.thumbnail_url || "",
      contentMarkdown: initialData?.content_en || initialData?.contentEn || "",
      freePreview: initialData?.free_preview || false,
    },
  })

  const courseId = form.watch("courseId")

  useEffect(() => {
    let cancelled = false

    async function loadModules() {
      if (!courseId) {
        setModules([])
        return
      }
      try {
        const res = await fetch(`/api/admin/modules?courseId=${encodeURIComponent(courseId)}`)
        if (!res.ok) {
          setModules([])
          return
        }
        const data = await res.json()
        if (!cancelled) setModules(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setModules([])
      }
    }

    loadModules()

    return () => {
      cancelled = true
    }
  }, [courseId])

  async function onSubmit(data: LessonFormData) {
    setIsLoading(true)
    try {
      const cleanData = {
        ...data,
        moduleId: data.moduleId || null,
        durationMinutes: data.durationMinutes || null,
        videoUrl: data.videoUrl || null,
        contentMarkdown: data.contentMarkdown || null,
      }

      const isEdit = !!initialData?.id
      const url = isEdit ? `/api/admin/lessons/${initialData.id}` : "/api/admin/lessons"
      const method = isEdit ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details?.fieldErrors ? JSON.stringify(error.details.fieldErrors) : error.error)
      }

      const lesson = await response.json()
      toast.success(isEdit ? "Lesson updated successfully" : "Lesson created successfully")
      
      // Redirect to course lessons page if courseId is available, otherwise lessons index
      if (cleanData.courseId) {
        router.push(`/admin/courses/${cleanData.courseId}`)
      } else {
        router.push(`/admin/lessons`)
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save lesson")
      console.error("[v0] Lesson save error:", error)
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

  const safeParseInt = (value: string): number | null => {
    const parsed = Number.parseInt(value, 10)
    return isNaN(parsed) ? null : parsed
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormLayout title="Basic Information" description="Enter the basic lesson details">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="titleEn"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Title (English)</FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        {...field}
                        placeholder="Introduction to Python"
                        onBlur={(e) => {
                          field.onBlur()
                          if (!form.getValues("slug")) {
                            form.setValue("slug", generateSlug(e.target.value))
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titleAr"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Title (Arabic)</FormLabel>
                  <FormControl>
                    <div>
                      <Input {...field} placeholder="مقدمة في بايثون" dir="rtl" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <div>
                      <Input {...field} placeholder="introduction-to-python" />
                    </div>
                  </FormControl>
                  <FormDescription>URL-friendly identifier</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseId"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.titleEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="moduleId"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Module (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "__none" ? null : value)}
                    value={field.value || "__none"}
                    disabled={!courseId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={courseId ? "Select module" : "Select course first"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none">No module</SelectItem>
                      {modules.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.title_en || m.titleEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contentType"
              render={({ field }: { field: any }) => (
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
              render={({ field }: { field: any }) => (
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
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Order Index</FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type="number"
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(safeParseInt(e.target.value) ?? 0)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type="number"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(safeParseInt(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="freePreview"
            render={({ field }: { field: any }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
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
        </FormLayout>

        <FormLayout title="Content" description="Add lesson content and resources">
          <FormField
            control={form.control}
            name="videoUrl"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Video URL or Upload</FormLabel>
                <FormControl>
                  <MediaUploadField
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="video"
                    placeholder="https://youtube.com/... or upload video"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="thumbnailUrl"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Thumbnail URL or Upload (Cover Pic)</FormLabel>
                <FormControl>
                  <MediaUploadField
                    value={field.value || ""}
                    onChange={field.onChange}
                    type="image"
                    placeholder="https://... or upload image"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contentMarkdown"
            render={({ field }: { field: any }) => (
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
        </FormLayout>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Lesson" : "Create Lesson"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
