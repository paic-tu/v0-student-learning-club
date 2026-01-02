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
import { FormLayout } from "@/components/admin/form-layout"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const lessonSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  slug: z.string().min(1, "Slug is required"),
  courseId: z.number({ required_error: "Course is required" }).int().positive(),
  trackId: z.number().int().positive().optional().nullable(),
  contentType: z.enum(["video", "article", "quiz", "assignment"]),
  status: z.enum(["draft", "published"]),
  orderIndex: z.number().int().min(0),
  durationMinutes: z.number().int().min(0).optional().nullable(),
  videoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  contentMarkdown: z.string().optional().nullable(),
  freePreview: z.boolean().default(false),
  prerequisites: z.array(z.number()).default([]),
})

type LessonFormData = z.infer<typeof lessonSchema>

interface LessonFormProps {
  courses: Array<{ id: number; titleEn: string }>
  initialData?: Partial<LessonFormData>
}

export function LessonForm({ courses, initialData }: LessonFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      titleEn: initialData?.titleEn || "",
      titleAr: initialData?.titleAr || "",
      slug: initialData?.slug || "",
      courseId: initialData?.courseId,
      contentType: initialData?.contentType || "video",
      status: initialData?.status || "draft",
      orderIndex: initialData?.orderIndex ?? 0,
      durationMinutes: initialData?.durationMinutes ?? null,
      videoUrl: initialData?.videoUrl || "",
      contentMarkdown: initialData?.contentMarkdown || "",
      freePreview: initialData?.freePreview || false,
      prerequisites: initialData?.prerequisites || [],
    },
  })

  async function onSubmit(data: LessonFormData) {
    setIsLoading(true)
    try {
      const cleanData = {
        ...data,
        durationMinutes: data.durationMinutes || null,
        videoUrl: data.videoUrl || null,
        contentMarkdown: data.contentMarkdown || null,
      }

      const response = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details?.fieldErrors ? JSON.stringify(error.details.fieldErrors) : error.error)
      }

      const lesson = await response.json()
      toast.success("Lesson created successfully")
      router.push(`/admin/lessons`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create lesson")
      console.error("[v0] Lesson creation error:", error)
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
              render={({ field }) => (
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
              render={({ field }) => (
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
              render={({ field }) => (
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const parsed = safeParseInt(value)
                      if (parsed !== null) field.onChange(parsed)
                    }}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
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
              render={({ field }) => (
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
            render={({ field }) => (
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video URL</FormLabel>
                <FormControl>
                  <div>
                    <Input {...field} value={field.value || ""} placeholder="https://youtube.com/..." />
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
