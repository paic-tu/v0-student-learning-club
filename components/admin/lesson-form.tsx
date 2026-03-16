"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
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
  assignmentAllowedMimeTypes: z.string().optional().nullable(),
  assignmentMaxFileSizeMb: z.coerce.number().int().min(1).max(500).optional().nullable(),
  assignmentDueAt: z.string().optional().nullable(),
  assignmentQuestionMarkdown: z.string().optional().nullable(),
  assignmentAllowText: z.boolean().optional().default(true),
  assignmentAllowFiles: z.boolean().optional().default(true),
  assignmentMaxFiles: z.coerce.number().int().min(1).max(10).optional().nullable(),
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
  const assignmentCfg = (initialData?.assignmentConfig || initialData?.assignment_config || {}) as any

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      titleEn: initialData?.titleEn || initialData?.title_en || "",
      titleAr: initialData?.titleAr || initialData?.title_ar || "",
      slug: initialData?.slug || "",
      courseId: initialData?.courseId || initialData?.course_id || undefined,
      moduleId: initialData?.moduleId || initialData?.module_id || null,
      contentType: (initialData?.type as any) || (initialData?.content_type as any) || "video",
      status: (initialData?.status as any) || "draft",
      orderIndex: initialData?.orderIndex || initialData?.order_index || 0,
      durationMinutes: initialData?.durationMinutes || initialData?.duration_minutes || undefined,
      videoUrl: initialData?.videoUrl || initialData?.video_url || "",
      thumbnailUrl: initialData?.thumbnailUrl || initialData?.thumbnail_url || "",
      contentMarkdown: initialData?.contentEn || initialData?.content_en || "",
      freePreview: initialData?.freePreview || initialData?.free_preview || false,
      assignmentAllowedMimeTypes: Array.isArray(assignmentCfg?.allowedMimeTypes) ? assignmentCfg.allowedMimeTypes.join(", ") : "",
      assignmentMaxFileSizeMb: assignmentCfg?.maxFileSizeBytes ? Math.round(Number(assignmentCfg.maxFileSizeBytes) / 1024 / 1024) : 500,
      assignmentDueAt: assignmentCfg?.dueAt ? String(assignmentCfg.dueAt).slice(0, 16) : "",
      assignmentQuestionMarkdown: typeof assignmentCfg?.questionMarkdown === "string" ? assignmentCfg.questionMarkdown : "",
      assignmentAllowText: assignmentCfg?.allowText !== undefined ? Boolean(assignmentCfg.allowText) : true,
      assignmentAllowFiles: assignmentCfg?.allowFiles !== undefined ? Boolean(assignmentCfg.allowFiles) : true,
      assignmentMaxFiles: Number.isFinite(Number(assignmentCfg?.maxFiles)) ? Number(assignmentCfg.maxFiles) : 1,
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
      const cleanData: any = {
        ...data,
        moduleId: data.moduleId || null,
        durationMinutes: data.durationMinutes || null,
        videoUrl: data.videoUrl || null,
        contentMarkdown: data.contentMarkdown || null,
      }

      if (data.contentType === "assignment") {
        const allowedMimeTypes = String(data.assignmentAllowedMimeTypes || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        const maxMb = Number(data.assignmentMaxFileSizeMb || 500)
        const allowText = Boolean(data.assignmentAllowText)
        const allowFiles = Boolean(data.assignmentAllowFiles)
        const maxFilesRaw = Number(data.assignmentMaxFiles || 1)
        const maxFiles = Math.min(10, Math.max(1, Number.isFinite(maxFilesRaw) ? Math.round(maxFilesRaw) : 1))
        cleanData.assignmentConfig = {
          allowedMimeTypes,
          maxFileSizeBytes: Math.min(500, Math.max(1, Math.round(maxMb))) * 1024 * 1024,
          dueAt: data.assignmentDueAt ? new Date(data.assignmentDueAt).toISOString() : null,
          questionMarkdown: data.assignmentQuestionMarkdown?.trim() || null,
          allowText,
          allowFiles,
          maxFiles: allowFiles ? maxFiles : 0,
        }
      } else {
        cleanData.assignmentConfig = null
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
                <FormLabel>{form.getValues("contentType") === "assignment" ? "Assignment Instructions (Markdown)" : "Content (Markdown)"}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    rows={10}
                    placeholder={form.getValues("contentType") === "assignment" ? "Write assignment instructions here..." : "# Lesson Content..."}
                  />
                </FormControl>
                <FormDescription>Use Markdown for formatting</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("contentType") === "assignment" && (
            <div className="space-y-4 border rounded-md p-4">
              <h3 className="text-lg font-medium">Assignment Settings</h3>
              <FormField
                control={form.control}
                name="assignmentQuestionMarkdown"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Assignment question (Markdown)</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} rows={4} placeholder="Write the question the student should answer..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="assignmentAllowText"
                  render={({ field }: { field: any }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow text answer</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assignmentAllowFiles"
                  render={({ field }: { field: any }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow file upload</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assignmentMaxFiles"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Max files</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={10} {...field} value={field.value ?? 1} disabled={!form.watch("assignmentAllowFiles")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="assignmentMaxFileSizeMb"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Max file size (MB)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={500} {...field} value={field.value ?? 500} />
                      </FormControl>
                      <FormDescription>Up to 500MB per student</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignmentDueAt"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Due date (optional)</FormLabel>
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
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Allowed file types (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="e.g. application/pdf, image/png" />
                    </FormControl>
                    <FormDescription>Leave empty to allow any type</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
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
