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

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const courseSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  subtitleEn: z.string().optional().or(z.literal("")),
  subtitleAr: z.string().optional().or(z.literal("")),
  descriptionEn: z.string().min(10, "English description must be at least 10 characters"),
  descriptionAr: z.string().min(10, "Arabic description must be at least 10 characters"),
  language: z.string().default("ar"),
  requirements: z.array(z.string()).default([]),
  learningOutcomes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  instructorId: z.string().min(1, "Instructor is required"),
  categoryId: z.string().optional().nullable(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  duration: z.number().int().min(0),
  price: z.number().min(0),
  isFree: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  thumbnailUrl: z.string().url("Invalid thumbnail URL").optional().or(z.literal("")),
  videoUrl: z.string().url("Invalid video URL").optional().or(z.literal("")),
})

export function CourseForm({ categories: initialCategories, instructors, redirectBase }: CourseFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>(initialCategories)
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null)
  
  // New Category State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [newCategoryNameEn, setNewCategoryNameEn] = useState("")
  const [newCategoryNameAr, setNewCategoryNameAr] = useState("")
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)


  const handleCreateCategory = async () => {
    if (!newCategoryNameEn || !newCategoryNameAr) {
      toast({
        title: "Validation Error",
        description: "Both English and Arabic names are required",
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
      form.setValue("categoryId", newCategory.id)
      setIsCategoryDialogOpen(false)
      setNewCategoryNameEn("")
      setNewCategoryNameAr("")
      toast({ title: "Success", description: "Category created successfully" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      })
    } finally {
      setIsCreatingCategory(false)
    }
  }

  const defaultValues = useMemo<z.infer<typeof courseSchema>>(
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
      isFree: true,
      isPublished: false,
      thumbnailUrl: "",
      videoUrl: "",
    }),
    [instructors],
  )

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues,
  })

  const onSubmit = async (data: z.infer<typeof courseSchema>) => {
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
        title: "Success",
        description: "Course created successfully",
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
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create course",
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
              Basic
            </TabsTrigger>
            <TabsTrigger value="description">
              <FileText className="w-4 h-4 mr-2" />
              Description
            </TabsTrigger>
            <TabsTrigger value="details">
              <List className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="media">
              <ImageIcon className="w-4 h-4 mr-2" />
              Media
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Cog className="w-4 h-4 mr-2" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6 mt-6">
            <FormLayout title="Basic Information" description="Enter the basic course details">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="titleEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (English) *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., Python for Beginners" 
                          dir="ltr" 
                          lang="en" 
                          autoComplete="off" 
                          autoCorrect="off" 
                          autoCapitalize="none" 
                          spellCheck={false}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">The course title displayed to students</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="titleAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Arabic) *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="بايثون للمبتدئين" dir="rtl" />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">العنوان المعروض للطلاب</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitleEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle (English)</FormLabel>
                      <FormControl>
                        <Input placeholder="Short subtitle in English" {...field} />
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
                      <FormLabel>Subtitle (Arabic)</FormLabel>
                      <FormControl>
                        <Input placeholder="Short subtitle in Arabic" {...field} />
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
                      <FormLabel>Instructor *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the course instructor" />
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
                      <p className="text-xs text-muted-foreground">Who will teach this course</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (Optional)</FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => field.onChange(value === "null" ? null : value)}
                          value={field.value || "null"}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">None</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.nameEn || category.name_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" type="button" title="Add new category">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create New Category</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">English Name</label>
                                <Input 
                                  value={newCategoryNameEn} 
                                  onChange={(e) => setNewCategoryNameEn(e.target.value)}
                                  placeholder="e.g. Web Development"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Arabic Name</label>
                                <Input 
                                  value={newCategoryNameAr} 
                                  onChange={(e) => setNewCategoryNameAr(e.target.value)}
                                  placeholder="مثال: تطوير الويب"
                                  dir="rtl"
                                />
                              </div>
                              <Button onClick={handleCreateCategory} disabled={isCreatingCategory} className="w-full" type="button">
                                {isCreatingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create
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
                      <FormLabel>Difficulty Level *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Target audience level</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes) *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="600"
                          onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Total course duration</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormLayout>
          </TabsContent>

          {/* Description Tab */}
          <TabsContent value="description" className="space-y-6 mt-6">
            <FormLayout title="Course Description" description="Provide detailed course information in both languages">
              <FormField
                control={form.control}
                name="descriptionEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (English) *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={8}
                        placeholder="Provide a comprehensive description of your course..."
                        dir="ltr"
                        lang="en"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{field.value?.length || 0} characters</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descriptionAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Arabic) *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={8}
                        placeholder="قدم وصفاً شاملاً لدورتك..."
                        dir="rtl"
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">{field.value?.length || 0} أحرف</p>
                    <FormMessage />
                  </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="en">English</SelectItem>
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
            <FormLayout title="Course Details" description="Manage requirements, learning outcomes, and tags">
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requirements</FormLabel>
                      <FormControl>
                        <StringListInput 
                          value={field.value} 
                          onChange={field.onChange} 
                          placeholder="Add a requirement..."
                        />
                      </FormControl>
                      <FormDescription>
                        What students should know before taking this course.
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
                      <FormLabel>Learning Outcomes</FormLabel>
                      <FormControl>
                        <StringListInput 
                          value={field.value} 
                          onChange={field.onChange} 
                          placeholder="Add a learning outcome..."
                        />
                      </FormControl>
                      <FormDescription>
                        What students will learn from this course.
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
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <StringListInput 
                          value={field.value} 
                          onChange={field.onChange} 
                          placeholder="Add a tag..."
                        />
                      </FormControl>
                      <FormDescription>
                        Keywords to help students find your course.
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
            <FormLayout title="Media & Thumbnails" description="Add course thumbnail and video URLs">
              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://example.com/thumbnail.jpg"
                        onChange={(e) => {
                          field.onChange(e)
                          setPreviewThumbnail(e.target.value)
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Course thumbnail image URL (HTTPS)</p>
                    {previewThumbnail && (
                      <div className="mt-4 p-4 border rounded-lg">
                        <p className="text-xs font-medium mb-2">Preview:</p>
                        <img
                          src={previewThumbnail || "/placeholder.svg"}
                          alt="Thumbnail preview"
                          className="h-40 w-full object-cover rounded"
                          onError={() => setPreviewThumbnail(null)}
                        />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intro Video URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://example.com/video.mp4 or https://youtube.com/watch?v=..."
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Link to intro or course trailer video</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormLayout>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6 mt-6">
            <FormLayout title="Pricing & Publishing" description="Configure course pricing and availability">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
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
                      <p className="text-xs text-muted-foreground">Leave at 0 for free courses</p>
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
                        <FormLabel>Free Course</FormLabel>
                        <p className="text-xs text-muted-foreground">Mark this course as free</p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Publish Course</FormLabel>
                      <p className="text-xs text-muted-foreground">Make this course visible to students</p>
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
            Create Course
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading} size="lg">
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
