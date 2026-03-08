"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Plus, X } from "lucide-react"
import { StringListInput } from "@/components/ui/string-list-input"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createCategoryAction } from "@/lib/actions/category"

import { MediaUploadField } from "@/components/admin/media-upload-field"
import { CourseCard } from "@/components/course-card"

export function CourseEditForm({
  course,
  categories,
  instructors,
  lang,
}: { course: any; categories: any[]; instructors: any[]; lang: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const isAr = lang === "ar"
  
  // Category management
  const [localCategories, setLocalCategories] = useState(categories)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(course.category_id?.toString() || "")

  // Preview State
  const [previewData, setPreviewData] = useState({
    ...course,
    category_id: course.category_id?.toString() || "",
    instructor_id: course.instructor_id?.toString() || "",
    difficulty: course.difficulty || "beginner",
    duration: course.duration || 0,
    price: course.price || 0,
    is_free: course.is_free || false,
    thumbnail_url: course.thumbnail_url || "",
    title_en: course.title_en || "",
    title_ar: course.title_ar || "",
  })

  const updatePreview = (field: string, value: any) => {
    setPreviewData((prev: any) => ({ ...prev, [field]: value }))
  }

  // Derive preview course object
  const selectedCategory = localCategories.find(c => c.id.toString() === previewData.category_id)
  const selectedInstructor = instructors.find(i => i.id.toString() === previewData.instructor_id)

  const previewCourse = {
    ...previewData,
    id: course.id, // Keep original ID
    category_name_en: selectedCategory?.nameEn || (selectedCategory as any)?.name_en || "",
    category_name_ar: selectedCategory?.nameAr || (selectedCategory as any)?.name_ar || "",
    instructor_name: selectedInstructor?.name || "",
  }

  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [newCategoryNameEn, setNewCategoryNameEn] = useState("")
  const [newCategoryNameAr, setNewCategoryNameAr] = useState("")
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  const handleCreateCategory = async () => {
    if (!newCategoryNameEn || !newCategoryNameAr) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "يرجى ملء جميع الحقول" : "Please fill all fields",
        variant: "destructive",
      })
      return
    }

    setIsCreatingCategory(true)
    try {
      const result = await createCategoryAction({
        nameEn: newCategoryNameEn,
        nameAr: newCategoryNameAr,
      })

      if (result.error) {
        toast({
          title: isAr ? "خطأ" : "Error",
          description: typeof result.error === "string" ? result.error : "Failed to create category",
          variant: "destructive",
        })
        return
      }

      if (result.success && result.category) {
        // Normalize the category object to match the component's expected shape (snake_case)
        const newCategory = {
          ...result.category,
          name_en: result.category.nameEn || result.category.name_en,
          name_ar: result.category.nameAr || result.category.name_ar,
        }
        
        setLocalCategories([...localCategories, newCategory])
        setSelectedCategoryId(newCategory.id.toString())
        setNewCategoryNameEn("")
        setNewCategoryNameAr("")
        setIsCategoryDialogOpen(false)
        toast({
          title: isAr ? "تم بنجاح" : "Success",
          description: isAr ? "تم إنشاء التصنيف بنجاح" : "Category created successfully",
        })
        router.refresh()
      }
    } catch (error) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsCreatingCategory(false)
    }
  }

  // JSON array fields
  const [requirements, setRequirements] = useState<string[]>(Array.isArray(course.requirements) ? course.requirements : [])
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>(Array.isArray(course.learning_outcomes) ? course.learning_outcomes : [])
  const [tags, setTags] = useState<string[]>(Array.isArray(course.tags) ? course.tags : [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      // ... existing submission logic ...
      const durationStr = (formData.get("duration") as string) || ""
      const priceStr = (formData.get("price") as string) || ""
      const duration =
        durationStr.trim() === "" ? undefined : Number.parseInt(durationStr, 10)
      const price =
        priceStr.trim() === "" ? undefined : Number.parseFloat(priceStr)

      const data = {
        title_en: formData.get("title_en"),
        title_ar: formData.get("title_ar"),
        subtitle_en: formData.get("subtitle_en"),
        subtitle_ar: formData.get("subtitle_ar"),
        description_en: formData.get("description_en"),
        description_ar: formData.get("description_ar"),
        language: formData.get("language"),
        requirements: requirements,
        learning_outcomes: learningOutcomes,
        tags: tags,
        instructor_id: formData.get("instructor_id") as string,
        category_id: formData.get("category_id") as string || null,
        difficulty: formData.get("difficulty"),
        duration,
        price,
        is_free: formData.get("is_free") === "on",
        is_published: formData.get("is_published") === "on",
        thumbnail_url: formData.get("thumbnail_url") || null,
        video_url: formData.get("video_url") || null,
      }

      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update course")

      toast({
        title: isAr ? "تم بنجاح" : "Success",
        description: isAr ? "تم تحديث الدورة بنجاح" : "Course updated successfully",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل تحديث الدورة" : "Failed to update course",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title_en">{isAr ? "العنوان بالإنجليزية" : "Title (English)"}</Label>
              <Input 
                id="title_en" 
                name="title_en" 
                defaultValue={course.title_en} 
                onChange={(e) => updatePreview("title_en", e.target.value)}
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title_ar">{isAr ? "العنوان بالعربية" : "Title (Arabic)"}</Label>
              <Input 
                id="title_ar" 
                name="title_ar" 
                defaultValue={course.title_ar} 
                onChange={(e) => updatePreview("title_ar", e.target.value)}
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle_en">{isAr ? "العنوان الفرعي بالإنجليزية" : "Subtitle (English)"}</Label>
              <Input id="subtitle_en" name="subtitle_en" defaultValue={course.subtitle_en || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle_ar">{isAr ? "العنوان الفرعي بالعربية" : "Subtitle (Arabic)"}</Label>
              <Input id="subtitle_ar" name="subtitle_ar" defaultValue={course.subtitle_ar || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor_id">{isAr ? "المدرب" : "Instructor"}</Label>
              <Select 
                name="instructor_id" 
                defaultValue={course.instructor_id.toString()}
                onValueChange={(val) => updatePreview("instructor_id", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((instructor: any) => (
                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.name} ({instructor.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category_id">{isAr ? "التصنيف" : "Category"}</Label>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsCategoryDialogOpen(true)}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {isAr ? "جديد" : "New"}
                </Button>
              </div>
              <Select 
                name="category_id" 
                value={selectedCategoryId} 
                onValueChange={(val) => {
                  setSelectedCategoryId(val)
                  updatePreview("category_id", val)
                }}
              >
                <SelectTrigger id="category_id">
                  <SelectValue placeholder={isAr ? "اختر التصنيف" : "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {localCategories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{category.name_en || category.nameEn}</span>
                        <span className="text-xs text-muted-foreground">{category.name_ar || category.nameAr}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">{isAr ? "المستوى" : "Difficulty"}</Label>
              <Select 
                name="difficulty" 
                defaultValue={course.difficulty}
                onValueChange={(val) => updatePreview("difficulty", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{isAr ? "مبتدئ" : "Beginner"}</SelectItem>
                  <SelectItem value="intermediate">{isAr ? "متوسط" : "Intermediate"}</SelectItem>
                  <SelectItem value="advanced">{isAr ? "متقدم" : "Advanced"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{isAr ? "لغة الدورة" : "Language"}</Label>
              <Select name="language" defaultValue={course.language || "ar"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">{isAr ? "العربية" : "Arabic"}</SelectItem>
                  <SelectItem value="en">{isAr ? "الإنجليزية" : "English"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">{isAr ? "المدة (بالدقائق)" : "Duration (minutes)"}</Label>
              <Input 
                id="duration" 
                name="duration" 
                type="number" 
                defaultValue={course.duration} 
                onChange={(e) => updatePreview("duration", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{isAr ? "السعر ($)" : "Price ($)"}</Label>
              <Input 
                id="price" 
                name="price" 
                type="number" 
                step="0.01" 
                defaultValue={course.price} 
                onChange={(e) => updatePreview("price", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_en">{isAr ? "الوصف بالإنجليزية" : "Description (English)"}</Label>
            <Textarea id="description_en" name="description_en" defaultValue={course.description_en} rows={4} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_ar">{isAr ? "الوصف بالعربية" : "Description (Arabic)"}</Label>
            <Textarea id="description_ar" name="description_ar" defaultValue={course.description_ar} rows={4} required />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">{isAr ? "تفاصيل الدورة" : "Course Details"}</h3>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label>{isAr ? "المتطلبات" : "Requirements"}</Label>
                <StringListInput 
                  value={requirements} 
                  onChange={setRequirements} 
                  placeholder={isAr ? "أضف متطلب..." : "Add requirement..."}
                />
              </div>

              <div className="space-y-2">
                <Label>{isAr ? "مخرجات التعلم" : "Learning Outcomes"}</Label>
                <StringListInput 
                  value={learningOutcomes} 
                  onChange={setLearningOutcomes} 
                  placeholder={isAr ? "أضف مخرج تعلم..." : "Add learning outcome..."}
                />
              </div>

              <div className="space-y-2">
                <Label>{isAr ? "الوسوم" : "Tags"}</Label>
                <StringListInput 
                  value={tags} 
                  onChange={setTags} 
                  placeholder={isAr ? "أضف وسم..." : "Add tag..."}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">{isAr ? "الوسائط" : "Media"}</h3>
            <div className="grid gap-4">
              <MediaUploadField
                id="thumbnail_url"
                name="thumbnail_url"
                label={isAr ? "رابط الصورة المصغرة" : "Thumbnail URL"}
                defaultValue={course.thumbnail_url || ""}
                placeholder="https://example.com/thumbnail.jpg"
                helperText={isAr ? "رابط الصورة المصغرة للدورة" : "Course thumbnail image URL"}
                isAr={isAr}
                type="image"
                onChange={(val) => updatePreview("thumbnail_url", val)}
              />

              <MediaUploadField
                id="video_url"
                name="video_url"
                label={isAr ? "رابط الفيديو" : "Video URL"}
                defaultValue={course.video_url || ""}
                placeholder="https://youtube.com/watch?v=..."
                helperText={isAr ? "رابط فيديو مقدمة الدورة" : "Course introduction or trailer video URL"}
                isAr={isAr}
                type="video"
                onChange={(val) => updatePreview("video_url", val)}
              />
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Switch 
                id="is_free" 
                name="is_free" 
                defaultChecked={course.is_free} 
                onCheckedChange={(checked) => updatePreview("is_free", checked)}
              />
              <Label htmlFor="is_free">{isAr ? "دورة مجانية" : "Free Course"}</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="is_published" name="is_published" defaultChecked={course.is_published} />
              <Label htmlFor="is_published">{isAr ? "منشور" : "Published"}</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
          </div>

          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isAr ? "إضافة تصنيف جديد" : "Add New Category"}</DialogTitle>
                <DialogDescription>
                  {isAr ? "أدخل تفاصيل التصنيف الجديد أدناه" : "Enter the details of the new category below"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-cat-en">{isAr ? "الاسم بالإنجليزية" : "Name (English)"}</Label>
                  <Input
                    id="new-cat-en"
                    value={newCategoryNameEn}
                    onChange={(e) => setNewCategoryNameEn(e.target.value)}
                    placeholder="e.g. Web Development"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-cat-ar">{isAr ? "الاسم بالعربية" : "Name (Arabic)"}</Label>
                  <Input
                    id="new-cat-ar"
                    value={newCategoryNameAr}
                    onChange={(e) => setNewCategoryNameAr(e.target.value)}
                    placeholder="مثال: تطوير الويب"
                    className="text-right"
                    dir="rtl"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsCategoryDialogOpen(false)} disabled={isCreatingCategory}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="button" onClick={handleCreateCategory} disabled={isCreatingCategory}>
                  {isCreatingCategory ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء" : "Create")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </form>
      </div>
      
      {/* Preview Section */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <h3 className="text-lg font-semibold mb-4">{isAr ? "معاينة البطاقة" : "Card Preview"}</h3>
          <CourseCard course={previewCourse} isPreview={true} hideBookmark={true} />
        </div>
      </div>
    </div>
  )
}
